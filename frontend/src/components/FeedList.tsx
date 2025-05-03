import React, { useEffect, useState, useCallback } from 'react';
import {
  List,
  Button,
  Input,
  Form,
  Typography,
  Space,
  Alert,
  Spin,
  notification,
  Modal,
  Popconfirm
} from 'antd';
import {
  DeleteOutlined,
  PlusOutlined,
  SyncOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useFeedsStore } from '../store/feedsStore';
import { FeedSubscribe, UserFeedSubscription, SubscriptionUpdatePayload } from '../types/feed';
import ArticleList from './ArticleList';
import { Article } from '../types/article';

const { Title, Text } = Typography;

const FeedList: React.FC = () => {
  const {
    subscriptions,
    articles,
    selectedFeedId,
    loading,
    articlesLoading,
    error,
    articlesError,
    fetchSubscriptions,
    subscribeToFeed,
    unsubscribeFromFeed,
    updateSubscriptionTitle,
    refreshFeed,
    setSelectedFeedId,
    updateArticleInList
  } = useFeedsStore();

  const [addFeedForm] = Form.useForm();
  const [editTitleForm] = Form.useForm();
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<UserFeedSubscription | null>(null);

  useEffect(() => {
    fetchSubscriptions();
    // eslint-disable-next-line
  }, []);

  const handleSubscribe = async (values: FeedSubscribe) => {
    try {
      await subscribeToFeed(values);
      addFeedForm.resetFields();
      notification.success({ message: 'Feed subscribed successfully!' });
    } catch (e: any) {
      console.error("Error subscribing feed:", e);
      notification.error({ message: 'Failed to subscribe', description: e?.message || error });
    }
  };

  const handleUnsubscribe = async (feedId: number) => {
    try {
      await unsubscribeFromFeed(feedId);
      notification.success({ message: 'Feed unsubscribed successfully!' });
    } catch (e: any) {
      console.error("Error unsubscribing feed:", e);
      notification.error({ message: 'Failed to unsubscribe', description: e?.message || error });
    }
  };

  const showEditModal = (subscription: UserFeedSubscription) => {
    setEditingSubscription(subscription);
    editTitleForm.setFieldsValue({ userTitle: subscription.user_title || '' });
    setIsEditModalVisible(true);
  };

  const handleEditTitle = async (values: { userTitle: string }) => {
    if (!editingSubscription) return;
    try {
        const payload: SubscriptionUpdatePayload = { userTitle: values.userTitle || null };
        await updateSubscriptionTitle(editingSubscription.feed_id, payload);
        notification.success({ message: 'Feed title updated!' });
        setIsEditModalVisible(false);
        setEditingSubscription(null);
    } catch (e: any) {
        console.error("Error updating title:", e);
        notification.error({ message: 'Failed to update title', description: e?.message || error });
    }
  };

  const handleRefresh = async (feedId: number) => {
    setRefreshingId(feedId);
    try {
      await refreshFeed(feedId);
      notification.success({ message: 'Feed refresh initiated. Articles will update shortly.' });
    } catch (e: any) {
      console.error("Error refreshing feed:", e);
      notification.error({ message: 'Failed to initiate feed refresh', description: e?.message });
    } finally {
      setTimeout(() => setRefreshingId(null), 500);
    }
  };

  const handleSelect = (feedId: number) => {
    setSelectedFeedId(feedId === selectedFeedId ? null : feedId);
  };
  
  const selectedSubscription = subscriptions.find(sub => sub.feed_id === selectedFeedId);
  const feedTitleForArticles = selectedSubscription?.user_title 
                              || selectedSubscription?.feed.title 
                              || selectedSubscription?.feed.url;

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', height: 'calc(100vh - 180px)' }}>
      <div style={{ flex: '0 0 350px', overflowY: 'auto', paddingRight: '10px' }}>
        <Title level={3}>Subscriptions</Title>
        {error && <Alert message={`Subscription List Error: ${error}`} type="error" showIcon style={{ marginBottom: 16 }} />}
        
        <Form
          form={addFeedForm}
          layout="vertical"
          onFinish={handleSubscribe}
          style={{ marginBottom: 24 }}
        >
          <Form.Item
            label="Subscribe to Feed URL"
            name="url"
            rules={[{ required: true, message: 'Please input feed URL!' }, { type: 'url', message: 'Invalid URL!' }]}
          >
            <Input placeholder="https://..." disabled={loading} />
          </Form.Item>
          <Form.Item label="Custom Title (Optional)" name="user_title">
            <Input placeholder="My custom name" disabled={loading} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={loading} block>
              Subscribe
            </Button>
          </Form.Item>
        </Form>
        
        {loading && !subscriptions.length && <Spin style={{ display: 'block', marginBottom: 16 }} />}
        {!loading && subscriptions.length === 0 && (
            <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
                No subscriptions yet. Subscribe to your first feed!
            </Text>
        )}
        {subscriptions.length > 0 && (
            <List
              bordered
              dataSource={subscriptions}
              renderItem={sub => {
                const isSelected = sub.feed_id === selectedFeedId;
                const displayTitle = sub.user_title || sub.feed.title || sub.feed.url;
                const itemStyle: React.CSSProperties = {
                  cursor: 'pointer',
                  backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                  borderLeft: isSelected ? '4px solid #1890ff' : 'none',
                  paddingLeft: isSelected ? '12px' : '16px',
                  transition: 'background-color 0.3s ease'
                };
                
                return (
                  <List.Item
                    key={sub.feed_id}
                    onClick={() => handleSelect(sub.feed_id)}
                    style={itemStyle}
                    actions={[
                      <Button
                        icon={<EditOutlined />}
                        onClick={(e) => { e.stopPropagation(); showEditModal(sub); }}
                        key="edit"
                        title="Edit Title"
                        size="small"
                      />,
                      <Button
                        icon={refreshingId === sub.feed_id ? <Spin size="small" /> : <SyncOutlined />}
                        onClick={(e) => { e.stopPropagation(); handleRefresh(sub.feed_id); }}
                        disabled={loading || !!refreshingId}
                        key="refresh"
                        title="Refresh Feed"
                        size="small"
                      />,
                      <Popconfirm
                        title="Unsubscribe from this feed?"
                        onConfirm={(e) => { e?.stopPropagation(); handleUnsubscribe(sub.feed_id); }}
                        onCancel={(e) => e?.stopPropagation()}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button
                          icon={<DeleteOutlined />}
                          danger
                          onClick={(e) => e.stopPropagation()}
                          loading={loading}
                          disabled={loading || !!refreshingId}
                          key="delete"
                          title="Unsubscribe"
                          size="small"
                        />
                      </Popconfirm>
                    ]}
                  >
                    <Space direction="vertical" size="small" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                      <Text style={{ fontWeight: isSelected ? 'bold' : 'normal' }} ellipsis={{ tooltip: displayTitle }}>
                        {displayTitle}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: sub.feed.url }}>{sub.feed.url}</Text>
                    </Space>
                  </List.Item>
                );
              }}
            />
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {selectedFeedId !== null ? (
          <ArticleList
            articles={articles}
            loading={articlesLoading}
            error={articlesError}
            feedTitle={feedTitleForArticles}
            onArticleUpdate={updateArticleInList}
          />
        ) : (
          <Alert message="Select a feed subscription to view its articles." type="info" style={{ marginTop: '60px' }} />
        )}
      </div>
      
      <Modal
        title="Edit Feed Title"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
            form={editTitleForm}
            layout="vertical"
            onFinish={handleEditTitle}
            initialValues={{ userTitle: editingSubscription?.user_title || '' }}
        >
            <Form.Item 
                name="userTitle" 
                label="Custom Title" 
                rules={[{ required: false }]}
            >
                <Input placeholder="Enter custom title (leave empty to use feed title)" />
            </Form.Item>
            <Form.Item style={{ textAlign: 'right' }}>
                <Space>
                    <Button onClick={() => setIsEditModalVisible(false)}>Cancel</Button>
                    <Button type="primary" htmlType="submit" loading={loading}>Save Title</Button>
                </Space>
            </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FeedList;