import React, { useState, useEffect, useCallback } from 'react';
import { List, Spin, Alert, Typography } from 'antd';
import { Article } from '../types/article';
import ArticleItem from './ArticleItem';

const { Text } = Typography;

interface ArticleListProps {
  articles: Article[];
  loading: boolean;
  error: string | null;
  feedDetailsMap: Record<number, { title: string; color: string }>;
  onArticleUpdate: (updatedArticle: Article) => void;
}

const ArticleList: React.FC<ArticleListProps> = ({ articles: initialArticles, loading, error, feedDetailsMap, onArticleUpdate }) => {
  const [articles, setArticles] = useState<Article[]>(initialArticles);

  useEffect(() => {
    setArticles(initialArticles);
  }, [initialArticles]);

  const handleArticleUpdate = useCallback((updatedArticle: Article) => {
    setArticles(prevArticles =>
      prevArticles.map(article =>
        article.id === updatedArticle.id ? updatedArticle : article
      )
    );
    onArticleUpdate(updatedArticle);
  }, [onArticleUpdate]);

  if (loading) {
    return <Spin tip="Loading articles..." style={{ display: 'block', marginTop: 40, textAlign: 'center' }} />;
  }

  if (error) {
    return <Alert message={`Error fetching articles: ${error}`} type="error" showIcon style={{ marginTop: 16 }} />;
  }

  if (!Array.isArray(articles) || articles.length === 0) {
    return <Text type="secondary" style={{ display: 'block', marginTop: 40, textAlign: 'center' }}>No articles found for the selected feed(s).</Text>;
  }

  return (
    <List
      itemLayout="vertical"
      size="large"
      dataSource={articles}
      renderItem={item => {
        const feedDetails = feedDetailsMap[item.feed_id];
        return (
          <ArticleItem
            key={item.id}
            article={item}
            onUpdate={handleArticleUpdate}
            feedDetails={feedDetails}
          />
        );
      }}
    />
  );
};

export default ArticleList;