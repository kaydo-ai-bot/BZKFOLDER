import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  LayoutDashboard,
  Users,
  Contact,
  Sparkles,
  Download,
  FileText,
  Settings,
  LogOut,
  FolderKey,
  FolderUp,
} from 'lucide-react';

interface AdminLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onTabChange,
  onNavigate,
  children,
}) => {
  const { logoutAdminSession } = useAuth();

  const handleLogout = async () => {
    await logoutAdminSession();
    onNavigate('/');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'contacts', label: 'Contacts', icon: Contact },
    { id: 'import', label: 'Importer VCF', icon: FolderUp },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'statuses', label: 'Statuts', icon: Sparkles },
    { id: 'exports', label: 'Exports', icon: Download },
    { id: 'logs', label: 'Logs Audit', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#07040d] text-gray-100 flex flex-col md:flex-row">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#0c0717] border-b md:border-b-0 md:border-r border-rose-500/20 p-4 space-y-6 shrink-0">
        
        {/* BRAND */}
        <div className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-600 p-0.5 shadow-lg shadow-rose-900/40">
            <div className="w-full h-full bg-[#120818] rounded-[10px] flex items-center justify-center">
              <FolderKey className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <div>
            <div className="font-extrabold text-white text-sm tracking-wider">BZK FOLDER 🥷</div>
            <div className="text-[10px] font-mono font-bold text-rose-400">ADMIN PANEL</div>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                  active
                    ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-lg shadow-rose-950/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-rose-400' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* LOGOUT BUTTON */}
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion Admin
          </button>
        </div>

      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-8 space-y-6 overflow-x-hidden">
        
        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-rose-500/20 pb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
            <span className="text-sm font-bold text-white tracking-wide uppercase">
              Panneau d'Administration Propriétaire
            </span>
          </div>

          <button
            onClick={() => onNavigate('/')}
            className="text-xs font-medium text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
          >
            Retour au Site Public
          </button>
        </header>

        {children}

      </main>

    </div>
  );
};
