import React from 'react';
import { Typography } from 'antd';
import FeedList from './FeedList';

const { Title, Paragraph } = Typography;

function Home(): React.ReactElement {
    // Zde bude hlavní obsah aplikace po přihlášení
    // Např. seznam feedů, zobrazení položek atd.
    return (
        <div>
            <Typography>
                <Title level={2}>Home - Content Aggregator</Title>
                <Paragraph>Welcome! Your feeds and content will appear here.</Paragraph>
            </Typography>
            <FeedList />
        </div>
    );
}

export default Home; 