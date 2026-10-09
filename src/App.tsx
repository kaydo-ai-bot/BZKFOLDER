import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from './components/ToastContainer';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';

// Admin / Owner Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminContacts } from './pages/admin/AdminContacts';
import { AdminVcfImport } from './pages/admin/AdminVcfImport';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminStatuses } from './pages/admin/AdminStatuses';
import { AdminExports } from './pages/admin/AdminExports';
import { AdminLogs } from './pages/admin/AdminLogs';
import { AdminLayout } from './components/AdminLayout';

function MainApp() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [adminTab, setAdminTab] = useState<string>(() => (window.location.pathname === '/admin/import' ? 'import' : 'contacts'));
  const { isAdmin } = useAuth();

  const navigate = (path: string) => {
    if (path === '/admin/import') {
      setAdminTab('import');
      path = '/admin';
    } else if (path === '/admin') {
      setAdminTab('contacts');
    }
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname || '/';
      setCurrentPath(p);
      if (p === '/admin/import') {
        setAdminTab('import');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isAdminRoute = currentPath.startsWith('/admin') || currentPath === '/numbers';

  // ========================================================
  // OWNER ONLY PROTECTED SPACE (/admin)
  // ========================================================
  if (isAdminRoute) {
    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-[#080d0a] text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
          <Navbar currentPath={currentPath} onNavigate={navigate} />
          <ToastContainer />
          <main className="flex-1 flex items-center justify-center p-4">
            <AdminLogin onNavigate={navigate} />
          </main>
          <Footer onNavigate={navigate} />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#070b09] text-zinc-100 font-['Plus_Jakarta_Sans',sans-serif]">
        <ToastContainer />
        <AdminLayout currentTab={adminTab} onTabChange={(tab) => setAdminTab(tab)} onNavigate={navigate}>
          {adminTab === 'import' && (
            <AdminVcfImport onNavigate={navigate} onSuccess={() => setAdminTab('contacts')} />
          )}
          {adminTab === 'dashboard' && <AdminDashboard />}
          {adminTab === 'statuses' && <AdminStatuses />}
          {adminTab === 'exports' && <AdminExports />}
          {adminTab === 'logs' && <AdminLogs />}
          {(adminTab === 'contacts' || adminTab === 'users' || !['import', 'dashboard', 'statuses', 'exports', 'logs'].includes(adminTab)) && (
            <AdminContacts onNavigate={navigate} onOpenImport={() => setAdminTab('import')} />
          )}
        </AdminLayout>
      </div>
    );
  }

  // ========================================================
  // PUBLIC VISITOR SPACE
  // ========================================================
  return (
    <div className="min-h-screen bg-[#080d0a] text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar currentPath={currentPath} onNavigate={navigate} />
      <ToastContainer />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentPath === '/' && <Home onNavigate={navigate} />}
        {currentPath === '/register' && <Home onNavigate={navigate} />}
        {currentPath === '/privacy' && <Privacy />}
        {currentPath === '/terms' && <Terms />}
        {currentPath !== '/' && currentPath !== '/register' && currentPath !== '/privacy' && currentPath !== '/terms' && (
          <Home onNavigate={navigate} />
        )}
      </main>

      <Footer onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
