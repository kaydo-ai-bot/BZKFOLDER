import React from 'react';
import { FolderKey, ShieldCheck, Lock, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#07050d] border-t border-purple-500/10 py-12 mt-20 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 p-0.5">
                <div className="w-full h-full bg-[#0d0a18] rounded-[6px] flex items-center justify-center">
                  <FolderKey className="w-4 h-4 text-purple-400" />
                </div>
              </div>
              <span className="font-bold text-white tracking-wider text-base">BZK FOLDER 🥷 BY KAYDO BZK 🥷</span>
            </div>
            <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
              Plateforme moderne d'annuaire sécurisé, attribution automatique des badges BZK (🥷🏿 / 🌸) et publication de statuts 24h.
            </p>
            <div className="flex items-center gap-4 text-xs text-purple-400">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Données protégées</span>
              <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Numéros masqués</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-widest mb-3">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => onNavigate('/')} className="hover:text-purple-300 transition">Accueil</button>
              </li>
              <li>
                <button onClick={() => onNavigate('/statuses')} className="hover:text-purple-300 transition">Statuts 24h</button>
              </li>
              <li>
                <button onClick={() => onNavigate('/register')} className="hover:text-purple-300 transition">Inscription</button>
              </li>
              <li>
                <button onClick={() => onNavigate('/dashboard')} className="hover:text-purple-300 transition">Dashboard Utilisateur</button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-widest mb-3">Espace Sécurisé</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('/admin/login')}
                  className="px-3 py-1.5 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-200 hover:text-white hover:border-cyan-400/50 transition flex items-center gap-1.5 text-xs font-mono font-bold"
                >
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  🔑 Espace Propriétaire
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/privacy')} className="hover:text-purple-300 transition text-xs">Politique de Confidentialité</button>
              </li>
              <li>
                <button onClick={() => onNavigate('/terms')} className="hover:text-purple-300 transition text-xs">Conditions d'Utilisation</button>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <div>
            © {new Date().getFullYear()} BZK FOLDER 🥷 BY KAYDO BZK 🥷. Tous droits réservés.
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            BZK FOLDER 🥷 BY KAYDO BZK 🥷 • Badges BZK 🥷🏿 🌸
          </div>
        </div>
      </div>
    </footer>
  );
};
