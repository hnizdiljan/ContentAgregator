import { create } from 'zustand';
import apiClient from '../utils/api';
import { Feed, UserFeedSubscription, FeedSubscribe, SubscriptionUpdatePayload } from '../types/feed';
import { Article } from '../types/article';

interface SubscriptionsState {
  subscriptions: UserFeedSubscription[];
  articles: Article[];
  selectedFeedId: number | null;
  loading: boolean;
  articlesLoading: boolean;
  error: string | null;
  articlesError: string | null;
  fetchSubscriptions: () => Promise<void>;
  subscribeToFeed: (feed: FeedSubscribe) => Promise<void>;
  unsubscribeFromFeed: (feedId: number) => Promise<void>;
  updateSubscriptionTitle: (feedId: number, payload: SubscriptionUpdatePayload) => Promise<void>;
  refreshFeed: (feedId: number) => Promise<void>;
  fetchArticles: (feedId: number) => Promise<void>;
  setSelectedFeedId: (feedId: number | null) => void;
  updateArticleInList: (updatedArticle: Article) => void;
}

export const useFeedsStore = create<SubscriptionsState>((set, get) => ({
  subscriptions: [],
  articles: [],
  selectedFeedId: null,
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
    if (get().selectedFeedId === feedId) {
      set({ selectedFeedId: null, articles: [], articlesError: null });
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

  setSelectedFeedId: (feedId: number | null) => {
    set({ selectedFeedId: feedId });
    if (feedId !== null) {
      get().fetchArticles(feedId);
    } else {
      set({ articles: [], articlesError: null });
    }
  },

  refreshFeed: async (feedId: number) => {
    try {
      await apiClient.post(`/feeds/${feedId}/refresh`);
      if (get().selectedFeedId === feedId) {
        await get().fetchArticles(feedId);
      }
    } catch (err: any) {
      console.error("Failed to trigger feed refresh:", err);
    }
  },

  fetchArticles: async (feedId: number) => {
    set({ articlesLoading: true, articlesError: null });
    try {
      const res = await apiClient.get<Article[]>(`/feeds/${feedId}/articles`);
      set({ articles: res.data });
    } catch (err: any) {
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
      )
    }));
  },
})); 