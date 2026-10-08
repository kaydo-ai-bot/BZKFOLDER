import React from 'react';
import { Register } from './Register';
import { FolderLock, Shield, Lock, ShieldCheck } from 'lucide-react';

interface HomeProps {
  onNavigate: (path: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 pb-16 animate-fadeIn max-w-2xl mx-auto px-2 sm:px-4">
      
      {/* GRANDE ZONE LOGO / TITRE EN HAUT */}
      <div className="text-center space-y-3 pt-4 sm:pt-8 max-w-2xl mx-auto">
        
        {/* LOGO EMBLEM ORIGINAL */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-900 p-0.5 shadow-2xl shadow-emerald-500/20">
          <div className="w-full h-full bg-[#080d0a] rounded-[22px] flex items-center justify-center">
            <FolderLock className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
          </div>
        </div>

        {/* TITRE PRINCIPAL & SOUS-TITRE */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-wider uppercase font-['Plus_Jakarta_Sans',sans-serif]">
            BZK FOLDER
          </h1>
          <div className="text-xs sm:text-sm font-mono tracking-[0.3em] uppercase text-emerald-400 font-extrabold">
            PRIVATE FOLDER
          </div>
        </div>

        {/* PETITE LIGNE DÉCORATIVE MODERNE */}
        <div className="flex items-center justify-center gap-2 pt-1 pb-1">
          <div className="w-8 sm:w-16 h-[2px] bg-gradient-to-r from-transparent to-emerald-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          <div className="w-8 sm:w-16 h-[2px] bg-gradient-to-l from-transparent to-emerald-500/60" />
        </div>

      </div>

      {/* CARTE PRINCIPALE CONTENANT LE FORMULAIRE D'INSCRIPTION & L'APERÇU ÉTIRÉ */}
      <Register onNavigate={onNavigate} />

      {/* CONFIDENTIALITÉ & PROTECTION DES NUMÉROS */}
      <div className="text-center pt-2 max-w-md mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 bg-[#0c130e] border border-emerald-500/25 px-4 py-2 rounded-full shadow-md">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Répertoire privé • Numéros réservés au propriétaire</span>
        </div>
      </div>

    </div>
  );
};
