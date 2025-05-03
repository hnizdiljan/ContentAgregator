import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Spin, Alert, Typography, Select, Card, message } from 'antd';
import { useSettingsStore } from '../store/settingsStore';
import { SettingsUpdate } from '../types/settings';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Common OpenAI models (extend as needed)
const TEXT_MODELS = [
  'gpt-4', 
  'gpt-4-turbo', 
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-3.5-turbo'
];
const TTS_MODELS = [
  'tts-1', 
  'tts-1-hd',
  'gpt-4o-mini-tts'
];

const SettingsPage: React.FC = () => {
  const {
    settings,
    isLoading,
    error: storeError,
    fetchSettings,
    updateSettings,
  } = useSettingsStore();

  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      // Don't set the API key in the form, only use placeholder/indicator
      form.setFieldsValue({
        openai_text_model: settings.openai_text_model,
        openai_tts_model: settings.openai_tts_model,
        openai_api_key: '********' // Placeholder if key is set
      });
    }
  }, [settings, form]);

  const handleFinish = async (values: SettingsUpdate) => {
    setIsSubmitting(true);
    try {
        // If the API key hasn't changed (still placeholder), don't send it in the update
        const dataToSend: SettingsUpdate = { ...values };
        if (settings?.openai_api_key_set && values.openai_api_key === '********') {
            delete dataToSend.openai_api_key; 
        } else if (values.openai_api_key === '') {
            // Allow clearing the key by submitting an empty string
            dataToSend.openai_api_key = null; 
        }

      await updateSettings(dataToSend);
      message.success('Settings updated successfully!');
      // Reset the API key field visually after successful save if it wasn't cleared
      if (dataToSend.openai_api_key !== null) {
         form.setFieldsValue({ openai_api_key: '********' });
      }
    } catch (err) {
      // Error message is handled by the store, but we catch here to stop the loading indicator
      // message.error('Failed to update settings.'); // Optional: show message here too
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !settings) {
    return <Spin tip="Loading settings..." style={{ display: 'block', marginTop: 50 }} />;
  }

  return (
    <Card title={<Title level={2}>Settings</Title>} style={{ maxWidth: 600, margin: 'auto', marginTop: 20 }}>
      <Paragraph>
        Configure your OpenAI settings here. Changes will affect new content generation requests.
      </Paragraph>
      {storeError && <Alert message={storeError} type="error" showIcon closable style={{ marginBottom: 16 }}/>}
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
            // Set initial values from store, api key handled in useEffect
            openai_text_model: settings?.openai_text_model,
            openai_tts_model: settings?.openai_tts_model,
        }}
      >
        <Form.Item
          name="openai_api_key"
          label="OpenAI API Key"
          tooltip="Leave unchanged to keep the current key. Enter a new key to update. Enter an empty value to clear the key."
          help={settings?.openai_api_key_set ? "An API key is currently configured." : "No custom API key configured. The system default key (if available) will be used."}
        >
          <Input.Password placeholder="Enter new API key or leave blank" autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          name="openai_text_model"
          label="Preferred Text Model"
          tooltip="Select the OpenAI model for generating summaries and blog posts."
        >
          <Select placeholder="Select a text model (or leave for default)" allowClear>
            {TEXT_MODELS.map(model => (
              <Option key={model} value={model}>{model}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="openai_tts_model"
          label="Preferred TTS Model"
          tooltip="Select the OpenAI model for generating audio."
        >
          <Select placeholder="Select a TTS model (or leave for default)" allowClear>
            {TTS_MODELS.map(model => (
              <Option key={model} value={model}>{model}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            Save Settings
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default SettingsPage; 