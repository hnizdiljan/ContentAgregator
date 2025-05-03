import React, { useEffect, useState } from 'react';
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

const { Title, Text } = Typography;

const FeedsPage: React.FC = () => { // Přejmenovaná komponenta
  const {
    subscriptions,
    loading,
    error,
    fetchSubscriptions,
    subscribeToFeed,
    unsubscribeFromFeed,
    updateSubscriptionTitle,
    refreshFeed,
    // Odebráno: articles, selectedFeedId, articlesLoading, articlesError, setSelectedFeedId, updateArticleInList
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

  // Odebráno: handleSelect, selectedSubscription, feedTitleForArticles

  return (
    // Odebrán vnější div s flex layoutem a sloupec pro ArticleList
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}> 
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
              // Odebráno: isSelected, onClick, itemStyle úpravy pro selection
              const displayTitle = sub.user_title || sub.feed.title || sub.feed.url;
              const itemStyle: React.CSSProperties = { // Zjednodušený styl
                padding: '12px 16px',
                // Odebrány styly pro selected state
              };
              
              return (
                <List.Item
                  key={sub.feed_id}
                  // Odebrán onClick={() => handleSelect(sub.feed_id)}
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
                    <Text ellipsis={{ tooltip: displayTitle }}> {/* Odebrán bold pro selected */}
                      {displayTitle}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: sub.feed.url }}>{sub.feed.url}</Text>
                  </Space>
                </List.Item>
              );
            }}
          />
      )}
      
      {/* Odebrán div s ArticleList a placeholderem */}
      
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
                label="New Custom Title (leave empty to remove)"
                name="userTitle"
            >
                <Input placeholder="My updated title" />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit">
                    Save Title
                </Button>
            </Form.Item>
        </Form>
      </Modal>
    </div> 
  );
};

export default FeedsPage; 