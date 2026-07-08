
import React, { useState, useEffect } from 'react';
import Home from './page-components/Home';
import Login from './page-components/Login';
import Admin from './page-components/Admin';
import AboutPage from './page-components/AboutPage';
import SkillsPage from './page-components/SkillsPage';
import ProjectsPage from './page-components/ProjectsPage';
import ExperiencePage from './page-components/ExperiencePage';
import BlogPage from './page-components/BlogPage';
import BlogPostPage from './page-components/BlogPostPage';
import ContactPage from './page-components/ContactPage';
import ServicesPage from './page-components/ServicesPage';

import LegalPage from './page-components/LegalPage';
import AIStudio from './page-components/AIStudio';
import DocsPage from './page-components/DocsPage'; // Main Docs page component
import FileTransferDownload from './components/FileTransferDownload';
import SecureVaultView from './components/SecureVaultView';
import Widgets from './page-components/Widgets';
import WidgetDateConverter from './page-components/WidgetDateConverter';
import WidgetCalendar from './page-components/WidgetCalendar';
import NotFoundPage from './page-components/NotFoundPage';
// @ts-ignore
import UserDashboard from './page-components/UserDashboard';
import { PathPage } from './types'; // Import PathPage type
import { NavigationContext } from './context/NavigationContext'; // Correctly import the centralized context
import { logDailyVisit, logToolClick } from './services/analytics';
import LiveEditWidget from './components/LiveEditWidget';
import FloatingEditorToolbar from './components/FloatingEditorToolbar';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PathPage>('home');
  const [selectedId, setSelectedId] = useState<string | null>(null);


  useEffect(() => {
    logDailyVisit();
  }, []);

  useEffect(() => {
    if (currentPage === 'services' && selectedId) {
      logToolClick(selectedId);
    }
  }, [currentPage, selectedId]);

  // Helper to parse pathname into page and ID
  // Added explicit return type annotation to ensure correct type inference for 'page'
  const parsePath = (): { page: PathPage; id: string | null } => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
    const parts = pathname.split('/').filter(Boolean); // Remove empty strings

    if (parts.length === 0) return { page: 'home' as PathPage, id: null }; // Home page

    const basePage = parts[0];
    const id = parts[1] || null;

    switch (basePage) {
      case 'admin': return { page: 'admin', id: null };
      case 'login': return { page: 'login', id: null };
      case 'about': return { page: 'about', id: null };
      case 'skills': return { page: 'skills', id: null };
      case 'projects': return { page: 'projects', id: null };
      case 'experience': return { page: 'experience', id: null };
      case 'tools': return { page: 'services', id: id };
      case 'blog': return { page: (id ? 'blog-post' : 'blog') as PathPage, id: id };
      case 'contact': return { page: 'contact', id: null };
      case 'legal': return { page: 'legal-page', id: id };
      case 'ai-studio': return { page: 'ai-studio', id: null };
      case 'docs': return { page: 'docs', id: id };
      case 'transfer': return { page: 'transfer', id: id };
      case 'vault': return { page: 'vault', id: id };
      case 'dashboard': return { page: 'user-dashboard', id: null };
      case 'widgets': {
        if (id === 'date-converter') return { page: 'widget-date-converter', id: null };
        if (id === 'calendar') return { page: 'widget-calendar', id: null };
        return { page: 'widgets', id: null };
      }
      default: return { page: 'not-found', id: null }; // Fallback to 404
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const { page, id } = parsePath();
      setCurrentPage(page);
      setSelectedId(id);
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState(); // Initial load

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);



  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (currentPage === 'admin') {
        document.documentElement.classList.add('admin-mode');
      } else {
        document.documentElement.classList.remove('admin-mode');
      }
    }
  }, [currentPage]);

  const navigate = (page: PathPage, id?: string, queryParams?: Record<string, string>) => {
    let path = '';
    switch (page) {
      case 'home': path = '/'; break;
      case 'admin': path = '/admin'; break;
      case 'login': path = '/login'; break;
      case 'about': path = '/about'; break;
      case 'skills': path = '/skills'; break;
      case 'projects': path = '/projects'; break;
      case 'experience': path = '/experience'; break;
      case 'services': path = id ? `/tools/${id}` : '/tools'; break;
      case 'blog': path = '/blog'; break;
      case 'blog-post': path = `/blog/${id}`; break;
      case 'contact': path = '/contact'; break;
      case 'legal-page': path = `/legal/${id}`; break;
      case 'ai-studio': path = '/ai-studio'; break;
      case 'docs': path = id ? `/docs/${id}` : '/docs'; break;
      case 'transfer': path = id ? `/transfer/${id}` : '/transfer'; break;
      case 'vault': path = id ? `/vault/${id}` : '/vault'; break;
      case 'user-dashboard': path = '/dashboard'; break;
      case 'widgets': path = '/widgets'; break;
      case 'widget-date-converter': path = '/widgets/date-converter'; break;
      case 'widget-calendar': path = '/widgets/calendar'; break;
      default: path = '/'; // Fallback
    }
    
    if (queryParams) {
      const search = new URLSearchParams(queryParams).toString();
      if (search) {
        path += `?${search}`;
      }
    }

    const currentPath = window.location.pathname + window.location.search;
    if (currentPath === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'home': return <Home />;
      case 'about': return <AboutPage />;
      case 'skills': return <SkillsPage />;
      case 'projects': return <ProjectsPage />;
      case 'experience': return <ExperiencePage />;
      case 'services': return <ServicesPage />;
      case 'blog': return <BlogPage />;
      case 'blog-post': return <BlogPostPage id={selectedId} />;
      case 'contact': return <ContactPage />;
      case 'login': return <Login />;
      case 'admin': return <Admin />;
      case 'legal-page': return <LegalPage slug={selectedId} />;
      case 'ai-studio': return <AIStudio />;
      case 'docs': return <DocsPage sectionId={selectedId} />;
      case 'transfer': return <FileTransferDownload transferId={selectedId} />;
      case 'vault': return <SecureVaultView vaultId={selectedId} />;
      case 'user-dashboard': return <UserDashboard />;
      case 'widgets': return <Widgets />;
      case 'widget-date-converter': return <WidgetDateConverter />;
      case 'widget-calendar': return <WidgetCalendar />;
      case 'not-found': return <NotFoundPage />;
      default: return <NotFoundPage />;
    }
  };

  return (
    <NavigationContext.Provider value={{ currentPage, selectedId, navigate }}>
      <div className="antialiased font-sans text-slate-800 bg-slate-50 min-h-screen">
        {renderContent()}
        <LiveEditWidget />
        <FloatingEditorToolbar />
      </div>
    </NavigationContext.Provider>
  );
};

export default App;
