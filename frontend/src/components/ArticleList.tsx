import React, { useState, useEffect, useCallback } from 'react';
import { List, Spin, Alert, Typography } from 'antd';
import { Article } from '../types/article';
import ArticleItem from './ArticleItem';

const { Text } = Typography;

interface ArticleListProps {
  articles: Article[];
  loading: boolean;
  error: string | null;
  feedTitle?: string | null;
  onArticleUpdate: (updatedArticle: Article) => void;
}

const ArticleList: React.FC<ArticleListProps> = ({ articles: initialArticles, loading, error, feedTitle, onArticleUpdate }) => {
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
    return <Spin style={{ display: 'block', marginTop: 20 }} />;
  }

  if (error) {
    return <Alert message={`Error fetching articles: ${error}`} type="error" showIcon style={{ marginTop: 16 }} />;
  }

  if (!Array.isArray(articles) || articles.length === 0) {
    return <Text type="secondary" style={{ display: 'block', marginTop: 20, textAlign: 'center' }}>No articles found for this feed.</Text>;
  }

  return (
    <div style={{ marginTop: 24 }}>
      {feedTitle && <Typography.Title level={4}>Articles from: {feedTitle}</Typography.Title>}
      <List
        itemLayout="vertical"
        size="large"
        dataSource={articles}
        renderItem={item => (
          <ArticleItem key={item.id} article={item} onUpdate={handleArticleUpdate} />
        )}
      />
    </div>
  );
};

export default ArticleList;