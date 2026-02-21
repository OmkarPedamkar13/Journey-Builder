import { Layout, Menu, Typography } from 'antd';
import { useState } from 'react';
import JourneyCreatePage from './features/journey-builder/pages/JourneyCreatePage';
import JourneyListPage from './features/journey-builder/pages/JourneyListPage';
import TemplatesPage from './features/journey-builder/pages/TemplatesPage';

const { Header, Content, Sider } = Layout;

export default function App() {
  const [activePage, setActivePage] = useState('journeys:list');

  const renderContent = () => {
    if (activePage === 'journeys:create') {
      return <JourneyCreatePage onBack={() => setActivePage('journeys:list')} />;
    }

    if (activePage === 'templates') {
      return <TemplatesPage />;
    }

    return (
      <JourneyListPage
        onCreateJourney={() => setActivePage('journeys:create')}
        onOpenJourney={() => setActivePage('journeys:create')}
      />
    );
  };

  return (
    <Layout style={{ minHeight: '100vh' }} className="cf-app-shell">
      <Sider width={260} theme="dark" className="cf-sider">
        <div style={{ padding: 20 }}>
          <Typography.Title level={4} style={{ margin: 0, color: 'var(--cf-yellow)' }}>
            Journey Suite
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activePage]}
          items={[
            {
              key: 'group:journeys',
              label: 'Journey',
              type: 'group',
              children: [
                { key: 'journeys:list', label: 'Journey List' },
                { key: 'journeys:create', label: 'Create Journey' },
              ],
            },
            {
              key: 'group:templates',
              label: 'Template',
              type: 'group',
              children: [{ key: 'templates', label: 'Template Library' }],
            },
          ]}
          onClick={({ key }) => setActivePage(key)}
        />
      </Sider>
      <Layout>
        <Header className="cf-header" style={{ display: 'flex', alignItems: 'center' }}>
          <Typography.Title level={4} style={{ margin: 0, color: 'var(--cf-yellow)' }}>
            {activePage === 'journeys:create'
              ? 'Create Journey'
              : activePage === 'templates'
                ? 'Template Library'
                : 'Journey List'}
          </Typography.Title>
        </Header>
        <Content style={{ padding: 20 }}>{renderContent()}</Content>
      </Layout>
    </Layout>
  );
}
