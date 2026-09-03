
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
import DeveloperPortal from './page-components/DeveloperPortal';
import CheckoutPage from './page-components/CheckoutPage';
import { PathPage } from './types'; // Import PathPage type
import { NavigationContext } from './context/NavigationContext'; // Correctly import the centralized context
import { logDailyVisit, logToolClick } from './services/analytics';
import LiveEditWidget from './components/LiveEditWidget';
import FloatingEditorToolbar from './components/FloatingEditorToolbar';
import AIAssistant from './components/AIAssistant';

interface AppProps {
  initialSlug?: string[];
}

const App: React.FC<AppProps> = ({ initialSlug = [] }) => {
  // Helper to parse slug parts into page and ID
  const parseSlug = (slugArr: string[]): { page: PathPage; id: string | null } => {
    if (slugArr.length === 0) return { page: 'home' as PathPage, id: null }; // Home page

    const basePage = slugArr[0];
    const id = slugArr[1] || null;

    switch (basePage) {
      case 'admin': return { page: 'admin', id: null };
      case 'login': return { page: 'login', id: null };
      case 'about': return { page: 'about', id: null };
      case 'skills': return { page: 'skills', id: null };
      case 'projects': return { page: 'projects', id: null };
      case 'experience': return { page: 'experience', id: null };
      case 'tools': {
        if (id === 'file-transfer' && typeof window !== 'undefined') {
          const transferQueryId = new URLSearchParams(window.location.search).get('id');
          if (transferQueryId) {
            return { page: 'transfer', id: transferQueryId };
          }
        }
        return { page: 'services', id: id };
      }
      case 'blog': return { page: (id ? 'blog-post' : 'blog') as PathPage, id: id };
      case 'contact': return { page: 'contact', id: null };
      case 'legal': return { page: 'legal-page', id: id };
      case 'ai-studio': return { page: 'ai-studio', id: null };
      case 'docs': return { page: 'docs', id: id };
      case 'transfer': return { page: 'transfer', id: id };
      case 'vault': return { page: 'vault', id: id };
      case 'dashboard': return { page: 'user-dashboard', id: null };
      case 'developers': return { page: 'developers', id: id };
      case 'checkout': return { page: 'checkout', id: id };
      case 'widgets': {
        if (id === 'date-converter') return { page: 'widget-date-converter', id: null };
        if (id === 'calendar') return { page: 'widget-calendar', id: null };
        return { page: 'widgets', id: null };
      }
      default: return { page: 'not-found', id: null }; // Fallback to 404
    }
  };

  const getInitialPageState = () => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const parts = pathname.split('/').filter(Boolean);
      return parseSlug(parts);
    }
    return parseSlug(initialSlug);
  };

  const initialState = getInitialPageState();
  const [currentPage, setCurrentPage] = useState<PathPage>(initialState.page);
  const [selectedId, setSelectedId] = useState<string | null>(initialState.id);


  useEffect(() => {
    logDailyVisit();
  }, []);

  useEffect(() => {
    if (currentPage === 'services' && selectedId) {
      logToolClick(selectedId);
    }
  }, [currentPage, selectedId]);

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const pathname = window.location.pathname;
      const parts = pathname.split('/').filter(Boolean);
      const { page, id } = parseSlug(parts);
      setCurrentPage(page);
      setSelectedId(id);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handlePopState);
      handlePopState(); // Initial load
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handlePopState);
      }
    };
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMode = () => {
      const mode = localStorage.getItem('liveEditMode') === 'true';
      if (mode) {
        document.documentElement.classList.add('live-edit-mode');
      } else {
        document.documentElement.classList.remove('live-edit-mode');
      }
    };
    checkMode();
    window.addEventListener('liveEditToggle', checkMode);
    return () => window.removeEventListener('liveEditToggle', checkMode);
  }, []);


  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isFileTransfer = currentPage === 'transfer' || (currentPage === 'services' && selectedId === 'file-transfer');
      const isCalendarTool = currentPage === 'widget-calendar' || currentPage === 'widget-date-converter' || (currentPage === 'services' && selectedId === 'date-converter');
      const isJpgToPdf = currentPage === 'services' && selectedId === 'jpg-to-pdf';
      const isIosProfile = currentPage === 'services' && selectedId === 'ios-profile';
      
      if (isFileTransfer || isCalendarTool || isJpgToPdf || isIosProfile) {
        document.documentElement.classList.add('hide-bg-svg');
      } else {
        document.documentElement.classList.remove('hide-bg-svg');
      }
    }
  }, [currentPage, selectedId]);

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
      case 'developers': path = id ? `/developers/${id}` : '/developers'; break;
      case 'checkout': path = id ? `/checkout/${id}` : '/checkout'; break;
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
      case 'developers': return <DeveloperPortal apiId={selectedId} />;
      case 'checkout': return <CheckoutPage planId={selectedId} />;
      case 'widgets': return <Widgets />;
      case 'widget-date-converter': return <WidgetDateConverter />;
      case 'widget-calendar': return <WidgetCalendar />;
      case 'not-found': return <NotFoundPage />;
      default: return <NotFoundPage />;
    }
  };

  const isEmbedded = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('embed') === 'true' ||
    window.self !== window.top ||
    window.location.pathname.startsWith('/widgets')
  );

  return (
    <NavigationContext.Provider value={{ currentPage, selectedId, navigate }}>
      <div className={`antialiased font-sans min-h-screen ${selectedId === 'ios-profile' ? 'bg-black text-white' : 'bg-slate-50 text-slate-800'}`}>
        {renderContent()}
        {!isEmbedded && <LiveEditWidget />}
        {!isEmbedded && <FloatingEditorToolbar />}
        {!isEmbedded && <AIAssistant />}
      </div>
    </NavigationContext.Provider>
  );
};

export default App;
