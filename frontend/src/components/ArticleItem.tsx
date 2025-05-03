import React, { useState, useCallback } from 'react';
import { Button, Card, Typography, Space, Spin, Alert, Tag } from 'antd';
import { AudioOutlined, FileTextOutlined, LoadingOutlined } from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';
import { Article } from '../types/article';
import apiClient from '../utils/api'; // Assuming your API client setup
import { useAuthStore } from '../store/authStore'; // Or however you manage state

const { Text, Paragraph, Link, Title } = Typography;

interface ArticleItemProps {
  article: Article;
  onUpdate: (updatedArticle: Article) => void; // Callback to update parent state
}

// Helper to construct full URL for static audio files
const getFullAudioUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  // Assuming backend serves static files from /static and API_BASE_URL is like http://localhost:8000/api/v1
  // We need the base URL part without the /api/v1
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');
  return `${baseUrl}${path}`;
};


const ArticleItem: React.FC<ArticleItemProps> = ({ article: initialArticle, onUpdate }) => {
  const [article, setArticle] = useState<Article>(initialArticle);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({
    summary: false,
    blogpost: false,
    summaryAudio: false,
    blogpostAudio: false,
  });
  const [error, setError] = useState<string | null>(null);

  const handleGeneration = useCallback(async (type: 'summary' | 'blogpost' | 'summaryAudio' | 'blogpostAudio') => {
    const endpointMap = {
      summary: `/articles/${article.id}/generate-summary`,
      blogpost: `/articles/${article.id}/generate-blogpost`,
      summaryAudio: `/articles/${article.id}/generate-summary-audio`,
      blogpostAudio: `/articles/${article.id}/generate-blogpost-audio`,
    };

    setLoadingStates(prev => ({ ...prev, [type]: true }));
    setError(null);

    try {
      const response = await apiClient.post<Article>(endpointMap[type]);
      const updatedArticle = response.data;
      setArticle(updatedArticle); // Update local state
      onUpdate(updatedArticle); // Notify parent
    } catch (err: any) { // Use 'any' or a more specific error type
      console.error(`Error generating ${type}:`, err);
      const errorMessage = err.response?.data?.detail || err.message || `Failed to generate ${type}.`;
      setError(errorMessage);
    } finally {
      setLoadingStates(prev => ({ ...prev, [type]: false }));
    }
  }, [article.id, onUpdate]);

  const formatPublishedDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Date unknown';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? dateString : formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };

  const summaryAudioUrl = getFullAudioUrl(article.short_summary_audio_path);
  const blogpostAudioUrl = getFullAudioUrl(article.blog_post_audio_path);

  return (
    <Card
      style={{ marginBottom: 16 }}
      title={<Link href={article.link} target="_blank" rel="noopener noreferrer">{article.title}</Link>}
      extra={<Text type="secondary">Published: {formatPublishedDate(article.published_at)}</Text>}
    >
      {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />}

      <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}>
        {article.description || 'No description available.'}
      </Paragraph>

      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Short Summary Section */}
        <div>
          <Space>
              <Title level={5} style={{marginBottom: 0}}>Short Summary</Title>
              <Button
                  icon={loadingStates.summary ? <LoadingOutlined /> : <FileTextOutlined />}
                  onClick={() => handleGeneration('summary')}
                  disabled={loadingStates.summary || loadingStates.blogpost || loadingStates.summaryAudio || loadingStates.blogpostAudio}
                  size="small"
              >
                  {article.short_summary ? 'Regenerate' : 'Generate'}
              </Button>
              {article.short_summary && (
                  <Button
                      icon={loadingStates.summaryAudio ? <LoadingOutlined /> : <AudioOutlined />}
                      onClick={() => handleGeneration('summaryAudio')}
                      disabled={!article.short_summary || loadingStates.summary || loadingStates.blogpost || loadingStates.summaryAudio || loadingStates.blogpostAudio}
                      size="small"
                  >
                     {article.short_summary_audio_path ? 'Regenerate Audio' : 'Generate Audio'}
                  </Button>
              )}
          </Space>
          {loadingStates.summary && <Spin size="small" style={{marginLeft: 8}} />} 
          {article.short_summary && (
            <Paragraph style={{ marginTop: 8, background: '#f0f2f5', padding: '8px 12px', borderRadius: '4px' }}>
              {article.short_summary}
            </Paragraph>
          )}
          {summaryAudioUrl && (
            <audio controls src={summaryAudioUrl} style={{ width: '100%', marginTop: 8 }}>
              Your browser does not support the audio element.
            </audio>
          )}
        </div>

        {/* Blog Post Section */}
        <div>
          <Space>
            <Title level={5} style={{marginBottom: 0}}>Blog Post</Title>
            <Button
              icon={loadingStates.blogpost ? <LoadingOutlined /> : <FileTextOutlined />}
              onClick={() => handleGeneration('blogpost')}
              disabled={loadingStates.summary || loadingStates.blogpost || loadingStates.summaryAudio || loadingStates.blogpostAudio}
              size="small"
            >
              {article.blog_post ? 'Regenerate' : 'Generate'}
            </Button>
            {article.blog_post && (
              <Button
                  icon={loadingStates.blogpostAudio ? <LoadingOutlined /> : <AudioOutlined />}
                  onClick={() => handleGeneration('blogpostAudio')}
                  disabled={!article.blog_post || loadingStates.summary || loadingStates.blogpost || loadingStates.summaryAudio || loadingStates.blogpostAudio}
                  size="small"
              >
                  {article.blog_post_audio_path ? 'Regenerate Audio' : 'Generate Audio'}
              </Button>
            )}
          </Space>
          {loadingStates.blogpost && <Spin size="small" style={{marginLeft: 8}} />} 
          {article.blog_post && (
            <Paragraph style={{ marginTop: 8, background: '#f0f2f5', padding: '8px 12px', borderRadius: '4px' }}>
              {article.blog_post}
            </Paragraph>
          )}
          {blogpostAudioUrl && (
            <audio controls src={blogpostAudioUrl} style={{ width: '100%', marginTop: 8 }}>
              Your browser does not support the audio element.
            </audio>
          )}
        </div>

      </Space>
    </Card>
  );
};

export default ArticleItem; 