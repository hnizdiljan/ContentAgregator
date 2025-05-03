import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Alert, Typography } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import apiClient from '../utils/api';

const { Title } = Typography;

const RegisterWrapper = styled(Card)`
  max-width: 400px;
  /* Default margin for larger screens */
  margin: 50px auto;

  /* Adjust margin for smaller screens */
  @media (max-width: 576px) { /* antd sm breakpoint */
    margin: 20px 15px; /* Smaller top/bottom margin, add side margin */
    max-width: none; /* Remove max-width on small screens to allow full width */
  }
`;

// Typ pro data posílaná na API
interface RegisterData {
  email: string;
  password: string;
}

function Register() {
  const [form] = Form.useForm(); // Pro přístup k formuláři (např. pro compare passwords)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Zabráníme defaultnímu odeslání formuláře
    console.log('HTML form onSubmit triggered!');
    // Ručně spustíme validaci a onFinish
    form.validateFields()
      .then(values => {
        onFinish(values as RegisterData); // Zavoláme původní onFinish logiku
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  const onFinish = async (values: RegisterData) => {
    console.log('Register form onFinish triggered!');
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/register', {
        email: values.email,
        password: values.password
      });

      console.log("Registration successful:", response.data);
      setSuccess('Registration successful! You can now log in.');
      form.resetFields(); // Vyčistí formulář po úspěchu
      navigate('/login');

    } catch (err: any) {
      console.error("Registration error object:", err); // Logování celého objektu chyby
      let errorMessage = 'Registration failed. An unexpected error occurred.';
      if (err.response) {
        // Chyba přišla s odpovědí od serveru
        console.error('Registration API Error Response Data:', err.response.data);
        console.error('Registration API Error Response Status:', err.response.status);
        console.error('Registration API Error Response Headers:', err.response.headers);
        if (err.response.data && err.response.data.detail) {
          errorMessage = `Registration failed: ${err.response.data.detail}`;
        } else {
          errorMessage = `Registration failed: Server responded with status ${err.response.status}`;
        }
      } else if (err.request) {
        // Požadavek byl odeslán, ale nepřišla odpověď
        console.error('Registration error: No response received from server.', err.request);
        errorMessage = 'Registration failed: Could not connect to the server. Please ensure it is running and accessible.';
      } else {
        // Chyba při sestavování požadavku
        console.error('Registration setup error before sending request:', err.message);
        errorMessage = `Registration failed: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegisterWrapper title={<Title level={3}>Register</Title>}>
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '20px' }}/>}
      {success && <Alert message={success} type="success" showIcon style={{ marginBottom: '20px' }}/>}
      <Form
        form={form}
        name="register_form"
        onFinish={onFinish}
        scrollToFirstError
        layout="vertical"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Please input your Email!', type: 'email' }
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="Email" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: 'Please input your Password!' },
            { min: 8, message: 'Password must be at least 8 characters long'}
            // Zde mohou být další pravidla pro heslo
          ]}
          hasFeedback
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Password" />
        </Form.Item>

        <Form.Item
          name="confirm"
          dependencies={['password']}
          hasFeedback
          rules={[
            { required: true, message: 'Please confirm your Password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('The two passwords that you entered do not match!'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Register
          </Button>
        </Form.Item>
        Already have an account? <Link to="/login">Log in</Link>
      </Form>
    </RegisterWrapper>
  );
}

export default Register; 