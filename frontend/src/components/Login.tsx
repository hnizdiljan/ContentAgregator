import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Alert, Typography } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import apiClient from '../utils/api';
import { useAuthStore } from '../store/authStore';

const { Title } = Typography;

const LoginWrapper = styled(Card)`
  max-width: 400px;
  margin: 50px auto;

  @media (max-width: 576px) {
    margin: 20px 15px;
    max-width: none;
  }
`;

// Typ pro odpověď z API
interface LoginResponse {
  access_token: string;
  token_type: string;
}

function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const setToken = useAuthStore((state) => state.setToken);

  // Získání cíle přesměrování po úspěšném přihlášení
  const from = location.state?.from?.pathname || '/';

  const onFinish = async (values: any) => {
    setError(null);
    setLoading(true);
    console.log('Login attempt with:', values);

    const formData = new URLSearchParams();
    formData.append('username', values.email);
    formData.append('password', values.password);

    try {
      const response = await apiClient.post<LoginResponse>('/auth/login/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('Login API Response Status:', response.status); // Logování stavu

      if (response.data && response.data.access_token) {
        console.log("Login successful, setting token.");
        setToken(response.data.access_token);
        console.log("Token set, navigating to:", from);
        navigate(from, { replace: true });
      } else {
        // Tento blok by neměl nastat při úspěšném 200 OK, ale necháváme pro úplnost
        console.error('Login successful (status 200) but no access token in response data:', response.data);
        setError('Login failed: Invalid response from server.');
      }
    } catch (err: any) {
      console.error("Login error object:", err); // Logování celého objektu chyby
      let errorMessage = 'Login failed. An unexpected error occurred.';
      if (err.response) {
        // Chyba přišla s odpovědí od serveru (např. 401, 400, 500)
        console.error('Login API Error Response Data:', err.response.data);
        console.error('Login API Error Response Status:', err.response.status);
        console.error('Login API Error Response Headers:', err.response.headers);
        if (err.response.data && err.response.data.detail) {
          errorMessage = `Login failed: ${err.response.data.detail}`;
        } else {
          errorMessage = `Login failed: Server responded with status ${err.response.status}`;
        }
      } else if (err.request) {
        // Požadavek byl odeslán, ale nepřišla odpověď (problém s konektivitou, backend neběží?)
        console.error('Login error: No response received from server.', err.request);
        errorMessage = 'Login failed: Could not connect to the server. Please ensure it is running and accessible.';
      } else {
        // Chyba při sestavování požadavku (problém v kódu před odesláním?)
        console.error('Login setup error before sending request:', err.message);
        errorMessage = `Login failed: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginWrapper title={<Title level={3}>Login</Title>}>
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '20px' }}/>}
      <Form
        name="login_form"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        layout="vertical"
      >
        <Form.Item
          name="email"
          rules={[{ required: true, message: 'Please input your Email!', type: 'email' }]}
        >
          <Input prefix={<MailOutlined />} placeholder="Email" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your Password!' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Password" />
        </Form.Item>
        {/* Zde může být "Forgot password" nebo "Remember me" */}
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Log in
          </Button>
        </Form.Item>
        Or <Link to="/register">register now!</Link>
      </Form>
    </LoginWrapper>
  );
}

export default Login; 