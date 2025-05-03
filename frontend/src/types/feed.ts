import { Article } from './article'; // Import Article if needed

// Represents the core Feed entity (stored once in DB)
export interface Feed {
  id: number;
  url: string;
  title?: string | null; // Canonical title from the feed itself
  created_at: string; // ISO string
  // user_id is removed
}

// Represents a user's subscription to a Feed
export interface UserFeedSubscription {
  feed_id: number;
  user_title?: string | null; // User's custom title for this feed
  subscribed_at: string; // ISO string
  feed: Feed; // Embed the full Feed object
}

// Type for the request body when subscribing to a new feed
export interface FeedSubscribe {
  url: string;
  user_title?: string | null;
}

// Type for the request body when updating a subscription title
export interface SubscriptionUpdatePayload {
    userTitle: string | null; // Matches the alias used in the backend endpoint
}


// Old FeedCreate might not be directly used for subscribing anymore
// Keeping it commented out for reference
// export interface FeedCreate {
//   url: string;
//   title?: string;
// } 