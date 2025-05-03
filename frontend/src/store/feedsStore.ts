import { create } from 'zustand';
import apiClient from '../utils/api';
import { Feed, UserFeedSubscription, FeedSubscribe, SubscriptionUpdatePayload } from '../types/feed';
import { Article } from '../types/article';

interface SubscriptionsState {
  subscriptions: UserFeedSubscription[];
  articles: Article[];
  selectedFeedIds: number[];
  loading: boolean;
  articlesLoading: boolean;
  error: string | null;
  articlesError: string | null;
  fetchSubscriptions: () => Promise<void>;
  subscribeToFeed: (feed: FeedSubscribe) => Promise<void>;
  unsubscribeFromFeed: (feedId: number) => Promise<void>;
  updateSubscriptionTitle: (feedId: number, payload: SubscriptionUpdatePayload) => Promise<void>;
  refreshFeed: (feedId: number) => Promise<void>;
  fetchArticles: (feedIds: number[]) => Promise<void>;
  setSelectedFeedIds: (feedIds: number[]) => void;
  updateArticleInList: (updatedArticle: Article) => void;
}

const sortArticlesDesc = (a: Article, b: Article) => {
  const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
  const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
  return dateB - dateA;
};

export const useFeedsStore = create<SubscriptionsState>((set, get) => ({
  subscriptions: [],
  articles: [],
  selectedFeedIds: [],
  loading: false,
  articlesLoading: false,
  error: null,
  articlesError: null,

  fetchSubscriptions: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.get<UserFeedSubscription[]>('/feeds/subscriptions');
      set({ subscriptions: res.data });
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || 'Failed to fetch subscriptions' });
    } finally {
      set({ loading: false });
    }
  },

  subscribeToFeed: async (feed: FeedSubscribe) => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.post<UserFeedSubscription>('/feeds/subscriptions', feed);
      set({ subscriptions: [...get().subscriptions, res.data] });
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || 'Failed to subscribe to feed' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  unsubscribeFromFeed: async (feedId: number) => {
    const currentSelectedIds = get().selectedFeedIds;
    if (currentSelectedIds.includes(feedId)) {
      const newSelectedIds = currentSelectedIds.filter(id => id !== feedId);
      set({ selectedFeedIds: newSelectedIds });
      if (newSelectedIds.length > 0) {
        get().fetchArticles(newSelectedIds);
      } else {
        set({ articles: [], articlesError: null });
      }
    }
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/feeds/subscriptions/${feedId}`);
      set({ subscriptions: get().subscriptions.filter(sub => sub.feed_id !== feedId) });
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || 'Failed to unsubscribe' });
    } finally {
      set({ loading: false });
    }
  },

  updateSubscriptionTitle: async (feedId: number, payload: SubscriptionUpdatePayload) => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.put<UserFeedSubscription>(`/feeds/subscriptions/${feedId}`, payload);
      set({
        subscriptions: get().subscriptions.map(sub =>
          sub.feed_id === feedId ? res.data : sub
        )
      });
    } catch (err: any) {
      set({ error: err?.response?.data?.detail || 'Failed to update subscription title' });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  setSelectedFeedIds: (feedIds: number[]) => {
    set({ selectedFeedIds: feedIds });
    if (feedIds.length > 0) {
      get().fetchArticles(feedIds);
    } else {
      set({ articles: [], articlesError: null });
    }
  },

  refreshFeed: async (feedId: number) => {
    if (get().selectedFeedIds.includes(feedId)) {
      set({ articlesLoading: true });
      try {
        await apiClient.post(`/feeds/${feedId}/refresh`);
        await get().fetchArticles(get().selectedFeedIds);
      } catch (err: any) {
        console.error("Failed during feed refresh or article refetch:", err);
        set({ articlesError: err?.response?.data?.detail || 'Failed to refresh feed or fetch articles' });
      }
    } else {
      try {
        await apiClient.post(`/feeds/${feedId}/refresh`);
      } catch (err: any) {
        console.error("Failed to trigger background feed refresh:", err);
      }
    }
  },

  fetchArticles: async (feedIds: number[]) => {
    if (feedIds.length === 0) {
      set({ articles: [], articlesLoading: false, articlesError: null });
      return;
    }
    set({ articlesLoading: true, articlesError: null });
    try {
      const params = new URLSearchParams();
      feedIds.forEach(id => params.append('feed_ids', id.toString()));
      const res = await apiClient.get<Article[]>(`/articles?${params.toString()}`);
      
      const sortedArticles = res.data.sort(sortArticlesDesc);
      
      set({ articles: sortedArticles });
    } catch (err: any) {
      console.error("Error fetching articles for feeds:", feedIds, err);
      set({ articlesError: err?.response?.data?.detail || 'Failed to fetch articles' });
      set({ articles: [] });
    } finally {
      set({ articlesLoading: false });
    }
  },

  updateArticleInList: (updatedArticle: Article) => {
    set(state => ({
      articles: state.articles.map(article =>
        article.id === updatedArticle.id ? updatedArticle : article
      ).sort(sortArticlesDesc)
    }));
  },
})); 