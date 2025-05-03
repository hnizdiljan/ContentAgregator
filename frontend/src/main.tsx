import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import './index.css';
import 'antd/dist/reset.css';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { Link } from 'react-router-dom';

// Import StyleProvider from @ant-design/cssinjs instead
import { StyleProvider } from '@ant-design/cssinjs';

// Importujeme layout, ochranu a loader
import AppLayout from './App';
import ProtectedRoute from './components/ProtectedRoute';

// Přímý import komponent stránek
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import FeedsPage from './components/FeedsPage';
import SettingsPage from './components/SettingsPage';

// Define your theme configuration
const customTheme = {
  token: {
    // Example: Customize primary color to a teal shade
    colorPrimary: '#13c2c2',
    // Example: Slightly increase border radius for a softer look
    borderRadius: 6,
  },
  // You can add component-specific customizations here too
  // components: {
  //   Button: {
  //     colorPrimary: '#ff4d4f', // Make primary buttons red (example)
  //   }
  // }
  // algorithm: antdTheme.darkAlgorithm, // Uncomment to enable dark mode
};

// Definice routeru bez lazy loadingu
const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    // Routy používající hlavní layout
    element: <AppLayout />,
    children: [
      {
        // Routy vyžadující přihlášení (chráněné)
        element: <ProtectedRoute />,
        children: [
          {
            index: true, // Hlavní stránka na "/"
            element: <Home />,
          },
          {
            path: "feeds",
            element: <FeedsPage />,
          },
          {
            path: "settings",
            element: <SettingsPage />,
          },
          // Zde přidáme další chráněné routy
          // {
          //   path: "/profile",
          //   element: <Suspense fallback={<Loader />}><LazyProfile /></Suspense>,
          // },
        ],
      },
      // Zde mohou být další routy pod AppLayout, které nejsou chráněné
    ],
  },
  {
    // Fallback pro 404 - zvažte vlastní komponentu místo <p>
    path: '*',
    element: (
        <div style={{ padding: 40, textAlign: 'center' }}>
            <h2>Page Not Found (404)</h2>
            <p>Sorry, the page you are looking for does not exist.</p>
            <Link to="/">Go back home</Link> 
        </div>
    ),
    // Pokud má mít 404 layout, přesuňte ji jako child do AppLayout route
  },
]);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);

root.render(
  // Wrap with StyleProvider from @ant-design/cssinjs
  <StyleProvider hashPriority="high">
    <ConfigProvider
      theme={customTheme}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  </StyleProvider>
);
