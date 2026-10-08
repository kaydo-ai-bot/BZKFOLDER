import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';

export const Terms: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 animate-fadeIn text-gray-300">
      <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-950/60 to-[#0e0a1f] border border-purple-500/30 backdrop-blur-2xl shadow-2xl space-y-6">
        
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <FileText className="w-8 h-8 text-purple-400" />
          <div>
            <h1 className="text-2xl font-black text-white">Conditions Générales d'Utilisation</h1>
            <p className="text-xs text-gray-400">BZK FOLDER 🥷 BY KAYDO BZK 🥷 • 2026</p>
          </div>
        </div>

        <div className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-white">1. Acceptation des Conditions</h2>
          <p>
            En utilisant la plateforme BZK FOLDER 🥷 BY KAYDO BZK 🥷, vous acceptez l'attribution automatique du suffixe BZK sur votre profil en fonction du sexe déclaré, ainsi que l'enregistrement de votre numéro de téléphone dans l'annuaire sécurisé.
          </p>

          <h2 className="text-lg font-bold text-white">2. Suffixes BZK Impératifs</h2>
          <p>
            Afin de préserver l'intégrité du réseau BZK FOLDER 🥷 BY KAYDO BZK 🥷, les suffixes BZK 🥷🏿 et BZK 🌸 sont appliqués par le serveur et ne peuvent pas être falsifiés ou retirés manuellement par les membres.
          </p>

          <h2 className="text-lg font-bold text-white">3. Conduite et Publication de Statuts</h2>
          <p>
            Tout contenu haineux, offensant, ou illégal publié dans les statuts 24h sera immédiatement modéré ou supprimé par l'administration, avec possibilité de suspension du compte.
          </p>
        </div>

      </div>
    </div>
  );
};
