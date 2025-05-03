import React from 'react';
import {
  Link,
  useLocation,
  Outlet
} from 'react-router-dom';
import { Layout, Menu, Typography, message } from 'antd';
import {
  HomeOutlined,
  SettingOutlined,
  LoginOutlined,
  LogoutOutlined,
  UserAddOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';

import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import FeedList from './components/FeedList'; // Assuming this shows feeds
import SettingsPage from './components/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';

import './App.css'; // Keep global styles if needed

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

// Helper to determine the selected menu key based on the current path
const useSelectedMenuKey = () => {
  const location = useLocation();
  // Make matching more robust
  if (location.pathname === '/feeds' || location.pathname.startsWith('/feeds/')) return ['feeds'];
  if (location.pathname === '/settings') return ['settings'];
  if (location.pathname === '/') return ['home'];
  return []; // Default no selection
};

function App() {
  const { token, logout } = useAuthStore();
  const isAuthenticated = !!token;

  const handleLogout = () => {
    logout();
    message.success('Logged out successfully');
    // Navigation to /login should be handled by ProtectedRoute wrapper
  };

  // Define Header Menu Items
  const headerMenuItems: any[] = []; // Use any[] or define a proper type if needed
  if (isAuthenticated) {
    headerMenuItems.push({
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout
    });
  } else {
    headerMenuItems.push({
      key: 'login',
      icon: <LoginOutlined />,
      label: <Link to="/login">Login</Link>
    });
    headerMenuItems.push({
      key: 'register',
      icon: <UserAddOutlined />,
      label: <Link to="/register">Register</Link>
    });
  }

  // Define Sider Menu Items
  const siderMenuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: <Link to="/">Home</Link>,
    },
    {
      key: 'feeds',
      icon: <UnorderedListOutlined />,
      label: <Link to="/feeds">Feeds</Link>,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">Settings</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px', position: 'sticky', top: 0, zIndex: 1, width: '100%' }}>
        <Title level={3} style={{ color: 'white', margin: '0 auto 0 0', flexShrink: 0 }}>Content Aggregator</Title>
        <Menu 
          theme="dark" 
          mode="horizontal" 
          style={{ flex: 1, minWidth: 0, justifyContent: 'flex-end' }} 
          selectable={false} 
          items={headerMenuItems} // Use items prop
        />
      </Header>
      <Layout>
        {isAuthenticated && (
          <Sider width={200} theme="light" breakpoint="lg" collapsedWidth="0" zeroWidthTriggerStyle={{ top: '12px' }}>
            {/* Use hook inside a component that's a child of Router */}
            <SiderMenu items={siderMenuItems} />
          </Sider>
        )}
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: '#fff',
              borderRadius: 8,
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
      <Footer style={{ textAlign: 'center' }}>Content Aggregator ©{new Date().getFullYear()}</Footer>
    </Layout>
  );
}

// Separate component to use the hook for selected keys
const SiderMenu = ({ items }: { items: any[] }) => {
    const selectedKeys = useSelectedMenuKey();
    return (
        <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            style={{ height: '100%', borderRight: 0 }}
            items={items}
        />
    );
};

export default App; // Export App directly
