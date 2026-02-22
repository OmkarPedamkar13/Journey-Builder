import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { Provider } from 'react-redux';
import App from './App';
import { store } from './app/store';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#f8c238',
            colorPrimaryHover: '#ffd45f',
            colorPrimaryActive: '#eab42d',
            colorInfo: '#f8c238',
            colorLink: '#0b0f1a',
            colorLinkHover: '#000000',
            colorSuccess: '#52c41a',
            colorWarning: '#faad14',
            colorError: '#ff4d4f',
            colorTextBase: '#0b0f1a',
            colorBgBase: '#f5f6f8',
            colorBgContainer: '#ffffff',
            colorTextSecondary: '#4b5563',
            colorBorder: '#e4e6eb',
            colorSplit: '#e4e6eb',
            borderRadius: 10,
            boxShadowSecondary: '0 10px 30px rgba(11, 15, 26, 0.08)',
          },
          components: {
            Button: {
              primaryColor: '#0b0f1a',
              defaultBorderColor: '#e4e6eb',
              defaultHoverBorderColor: '#f8c238',
              defaultHoverColor: '#0b0f1a',
              defaultActiveBorderColor: '#eab42d',
              colorPrimaryHover: '#ffd45f',
              colorPrimaryActive: '#eab42d',
              controlHeight: 38,
            },
            Menu: {
              itemSelectedColor: '#0b0f1a',
              itemSelectedBg: '#f8c238',
            },
            Tabs: {
              itemSelectedColor: '#0b0f1a',
              itemHoverColor: '#0b0f1a',
              inkBarColor: '#f8c238',
            },
            Select: {
              optionSelectedBg: '#fff7dd',
            },
            Card: {
              headerBg: '#ffffff',
            },
          },
        }}
      >
        <App />
      </ConfigProvider>
    </Provider>
  </React.StrictMode>
);
