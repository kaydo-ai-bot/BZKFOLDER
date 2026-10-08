import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FolderKey,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  LogOut,
  Users,
  LayoutDashboard,
  Menu,
  X,
  UserPlus,
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { isAdmin, logoutUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0b0813]/90 border-b border-purple-500/20 shadow-lg shadow-purple-950/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* BRAND LOGO */}
          <button
            onClick={() => handleNav('/')}
            className="flex items-center gap-2.5 text-left group transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-md shadow-purple-600/30 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0d0a18] rounded-[10px] flex items-center justify-center">
                <FolderKey className="w-5 h-5 text-purple-400 group-hover:text-cyan-300 transition-colors" />
              </div>
            </div>
            <div>
              <span className="font-black text-sm sm:text-lg tracking-wider bg-gradient-to-r from-white via-purple-200 to-cyan-400 bg-clip-text text-transparent">
                BZK FOLDER 🥷
              </span>
              <span className="hidden sm:block text-[9px] text-purple-400 font-mono tracking-widest uppercase">
                ENREGISTREMENT BZK
              </span>
            </div>
          </button>

          {/* DESKTOP NAV / SECURITY STICKER */}
          <div className="hidden md:flex items-center gap-3">
            
            <button
              onClick={() => handleNav('/register')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                currentPath === '/register' || currentPath === '/'
                  ? 'bg-purple-600/30 text-white border border-purple-500/50 shadow-md shadow-purple-900/40'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserPlus className="w-4 h-4 text-purple-400" />
              Enregistrer un Numéro
            </button>

            {/* OWNER SPACE (IF AUTHENTICATED) */}
            {isAdmin ? (
              <div className="flex items-center gap-2 pl-3 border-l border-gray-800">
                <button
                  onClick={() => handleNav('/admin')}
                  className="px-3 py-1.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-200 border border-rose-500/40 hover:bg-rose-500/30 transition flex items-center gap-1.5 shadow-lg shadow-rose-950"
                >
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  Espace Propriétaire
                </button>

                <button
                  onClick={logoutUser}
                  className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  title="Verrouiller / Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* SECURITY STICKER LOCK BUTTON */
              <button
                onClick={() => handleNav('/admin/login')}
                className="group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/30 text-xs font-mono font-bold text-gray-300 hover:text-white hover:border-cyan-400/50 transition backdrop-blur-md shadow-lg shadow-purple-950/50"
                title="Accès Propriétaire Sécurisé"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Lock className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] uppercase tracking-wider text-purple-200">
                  Accès Propriétaire
                </span>
              </button>
            )}

          </div>

          {/* MOBILE BUTTON */}
          <div className="md:hidden flex items-center gap-2">
            {!isAdmin && (
              <button
                onClick={() => handleNav('/admin/login')}
                className="p-2 rounded-xl text-purple-300 bg-purple-950/60 border border-purple-500/30 text-xs font-mono font-bold flex items-center gap-1"
                title="Accès Propriétaire"
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px]">Propriétaire</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => handleNav('/admin')}
                className="p-2 rounded-xl text-rose-300 bg-rose-950/60 border border-rose-500/30 text-xs font-mono font-bold flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px]">Espace</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};
