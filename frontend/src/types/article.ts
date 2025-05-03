export interface Article {
  id: number;
  title: string;
  link: string;
  description?: string | null;
  published_at?: string | null; // Store as string from JSON, potentially convert later
  feed_id: number;

  // Generated content fields
  short_summary?: string | null;
  blog_post?: string | null;
  short_summary_audio_path?: string | null;
  blog_post_audio_path?: string | null;
} 