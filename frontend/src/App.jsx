import { Layout, Menu, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import JourneyCreatePage from './features/journey-builder/pages/JourneyCreatePage';
import JourneyListPage from './features/journey-builder/pages/JourneyListPage';
import TemplatesPage from './features/journey-builder/pages/TemplatesPage';
import ExecutionsPage from './features/journey-builder/pages/ExecutionsPage';
import ExecutionDetailPage from './features/journey-builder/pages/ExecutionDetailPage';
import { createNewJourney } from './features/journey-builder/slice/journeyBuilderSlice';

const { Header, Content, Sider } = Layout;

function parseRoute(pathname) {
  const path = String(pathname || '/');
  if (path === '/' || path === '/journeys') return { name: 'journeys:list' };
  if (path === '/journeys/new') return { name: 'journeys:new' };

  let match = path.match(/^\/journeys\/([^/]+)\/edit$/);
  if (match) return { name: 'journeys:edit', journeyId: match[1] };

  if (path === '/templates') return { name: 'templates:list' };
  match = path.match(/^\/templates\/([^/]+)\/edit$/);
  if (match) return { name: 'templates:edit', templateId: match[1] };

  if (path === '/executions') return { name: 'executions:list' };
  match = path.match(/^\/executions\/([^/]+)$/);
  if (match) return { name: 'executions:detail', executionId: match[1] };

  return { name: 'journeys:list' };
}

export default function App() {
  const dispatch = useDispatch();
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname));

  const navigateTo = (path, replace = false) => {
    if (replace) window.history.replaceState(null, '', path);
    else window.history.pushState(null, '', path);
    setRoute(parseRoute(path));
  };

  useEffect(() => {
    const onPop = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleCreateJourney = () => {
    dispatch(createNewJourney());
    navigateTo('/journeys/new');
  };

  const selectedMenuKey = useMemo(() => {
    if (route.name.startsWith('journeys:')) return route.name === 'journeys:list' ? 'journeys:list' : 'journeys:create';
    if (route.name.startsWith('templates:')) return 'templates';
    if (route.name.startsWith('executions:')) return 'executions';
    return 'journeys:list';
  }, [route.name]);

  const renderContent = () => {
    if (route.name === 'journeys:new') {
      return <JourneyCreatePage onBack={() => navigateTo('/journeys')} />;
    }

    if (route.name === 'journeys:edit') {
      return <JourneyCreatePage journeyId={route.journeyId} onBack={() => navigateTo('/journeys')} />;
    }

    if (route.name === 'templates:list') {
      return (
        <TemplatesPage
          onOpenTemplateEdit={(id) => navigateTo(`/templates/${id}/edit`)}
        />
      );
    }
    if (route.name === 'templates:edit') {
      return (
        <TemplatesPage
          editTemplateId={route.templateId}
          onOpenTemplateEdit={(id) => navigateTo(`/templates/${id}/edit`)}
          onCloseTemplateEdit={() => navigateTo('/templates', true)}
        />
      );
    }
    if (route.name === 'executions:list') {
      return <ExecutionsPage onOpenExecution={(id) => navigateTo(`/executions/${id}`)} />;
    }
    if (route.name === 'executions:detail') {
      return <ExecutionDetailPage executionId={route.executionId} onBack={() => navigateTo('/executions')} />;
    }

    return (
      <JourneyListPage
        onCreateJourney={handleCreateJourney}
        onOpenJourney={(record) => navigateTo(`/journeys/${record._id}/edit`)}
      />
    );
  };

  return (
    <Layout style={{ minHeight: '100vh' }} className="cf-app-shell">
      <Sider width={260} theme="dark" className="cf-sider">
        <div style={{ padding: 20 }}>
          <Typography.Title level={4} style={{ margin: 0, color: 'var(--cf-yellow)' }}>
            Journey Builder
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenuKey]}
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
            {
              key: 'group:executions',
              label: 'Execution',
              type: 'group',
              children: [{ key: 'executions', label: 'Execution Logs' }],
            },
          ]}
          onClick={({ key }) => {
            if (key === 'journeys:create') {
              handleCreateJourney();
              return;
            }
            if (key === 'journeys:list') navigateTo('/journeys');
            if (key === 'templates') navigateTo('/templates');
            if (key === 'executions') navigateTo('/executions');
          }}
        />
      </Sider>
      <Layout>
        <Header className="cf-header" style={{ display: 'flex', alignItems: 'center' }}>
          <Typography.Title level={4} style={{ margin: 0, color: 'var(--cf-yellow)' }}>
            {route.name.startsWith('journeys:') && route.name !== 'journeys:list'
              ? 'Create Journey'
              : route.name.startsWith('templates:')
                ? 'Template Library'
                : route.name === 'executions:list'
                  ? 'Execution Logs'
                  : route.name === 'executions:detail'
                    ? 'Execution Detail'
                : 'Journey List'}
          </Typography.Title>
        </Header>
        <Content style={{ padding: 20 }}>{renderContent()}</Content>
      </Layout>
    </Layout>
  );
}
