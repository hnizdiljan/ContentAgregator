import React, { useEffect, useMemo } from 'react';
import { Typography, Select, Alert, Spin, Row, Col, Tag } from 'antd';
import ArticleList from './ArticleList';
import { useFeedsStore } from '../store/feedsStore';
import { UserFeedSubscription } from '../types/feed'; // Import pro typ subscription
import { generateColorFromId } from '../utils/colorUtils'; // Předpokládáme existenci této utility

const { Title, Paragraph } = Typography;
const { Option } = Select;

function Home(): React.ReactElement {
    const {
        subscriptions,
        articles,
        selectedFeedIds, // Přejmenováno
        loading: subscriptionsLoading,
        articlesLoading,
        error: subscriptionsError,
        articlesError,
        fetchSubscriptions,
        setSelectedFeedIds, // Přejmenováno
        updateArticleInList
      } = useFeedsStore();

    useEffect(() => {
        // Načteme odběry při prvním načtení stránky
        if (!subscriptions.length) {
            fetchSubscriptions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []); // Spustí se pouze jednou

    const handleSelectFeed = (feedIds: number[]) => { // Přijímá pole ID
        setSelectedFeedIds(feedIds); // Volá přejmenovanou akci
    };

    // Vytvoříme mapu pro snadný přístup k detailům feedu (název, barva)
    const feedDetailsMap = useMemo(() => {
        const map: Record<number, { title: string; color: string }> = {};
        subscriptions.forEach(sub => {
            map[sub.feed_id] = {
                title: sub.user_title || sub.feed.title || sub.feed.url,
                color: generateColorFromId(sub.feed_id) // Generování barvy
            };
        });
        return map;
    }, [subscriptions]);

    return (
        <Row gutter={[16, 24]}> {/* Zvětšený vertikální gutter */}
            <Col span={24}>
                <Typography>
                    <Title level={2}>Home - Articles</Title>
                    <Paragraph>Select one or more feeds to view their combined articles, sorted by publication date.</Paragraph>
                </Typography>
            </Col>
            
            <Col span={24}>
                <Select
                    mode="multiple" // Povolení výběru více položek
                    allowClear
                    showSearch
                    style={{ width: '100%', maxWidth: 600, marginBottom: '16px' }} // Širší select
                    placeholder="Select feed subscriptions"
                    optionFilterProp="children"
                    onChange={handleSelectFeed}
                    value={selectedFeedIds} // Používá nové pole ID
                    loading={subscriptionsLoading}
                    filterOption={(input, option) =>
                        option?.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0 
                    }
                    tagRender={(props) => { // Vlastní renderování tagů pro lepší vzhled
                        const { label, value, closable, onClose } = props;
                        const feedDetail = feedDetailsMap[value];
                        const color = feedDetail ? feedDetail.color : '#ccc'; // Použijeme barvu feedu
                        const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
                          event.preventDefault();
                          event.stopPropagation();
                        };
                        return (
                          <Tag
                            color={color}
                            onMouseDown={onPreventMouseDown}
                            closable={closable}
                            onClose={onClose}
                            style={{ marginRight: 3, color: '#fff', /* Text color for contrast */ fontWeight: 500 }}
                          >
                            {label}
                          </Tag>
                        );
                      }}
                >
                    {subscriptions.map(sub => (
                        <Option key={sub.feed_id} value={sub.feed_id}>
                            {sub.user_title || sub.feed.title || sub.feed.url}
                        </Option>
                    ))}
                </Select>
                {subscriptionsError && <Alert message={`Error loading subscriptions: ${subscriptionsError}`} type="error" showIcon />}
            </Col>

            <Col span={24}>
                {/* Podmínky pro zobrazení se mění na základě selectedFeedIds.length */}
                {selectedFeedIds.length > 0 ? (
                    <ArticleList
                        articles={articles} // Seřazený seznam z více feedů
                        loading={articlesLoading}
                        error={articlesError}
                        feedDetailsMap={feedDetailsMap} // Předáme mapu s detaily feedů
                        onArticleUpdate={updateArticleInList}
                        // feedTitle už není potřeba
                    />
                ) : (
                    !subscriptionsLoading && subscriptions.length > 0 && (
                         <Alert message="Select one or more feed subscriptions above to view articles." type="info" showIcon />
                    )
                )}
                 {/* Zobrazení loading a chyb */}
                {articlesLoading && <Spin tip="Loading articles..."><div style={{ padding: '50px 0', textAlign: 'center' }}></div></Spin>}
                {articlesError && selectedFeedIds.length > 0 && (
                    <Alert message={`Error loading articles: ${articlesError}`} type="warning" showIcon />
                )}
                {subscriptionsLoading && <Spin tip="Loading subscriptions..."><div style={{ padding: '20px 0' }}></div></Spin>} 
                {!subscriptionsLoading && subscriptions.length === 0 && !subscriptionsError && (
                     <Alert message="You have no subscriptions yet. Go to the Feeds page to add one." type="info" showIcon />
                )}
            </Col>
        </Row>
    );
}

export default Home; 