import React from 'react';
import { ShieldCheck, Lock, CheckCircle, Trash2 } from 'lucide-react';

export const Privacy: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 animate-fadeIn text-gray-300">
      <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-950/60 to-[#0e0a1f] border border-purple-500/30 backdrop-blur-2xl shadow-2xl space-y-6">
        
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <ShieldCheck className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-black text-white">Politique de Confidentialité</h1>
            <p className="text-xs text-gray-400">Dernière mise à jour : 2026</p>
          </div>
        </div>

        <div className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-white">1. Collecte et Consentement</h2>
          <p>
            BZK FOLDER 🥷 BY KAYDO BZK 🥷 enregistre uniquement les informations fournies volontairement lors de votre inscription : votre nom, numéro de téléphone, pays, sexe et photo optionnelle.
            L'acceptation explicite de l'enregistrement de votre numéro est obligatoire avant toute création de compte.
          </p>

          <h2 className="text-lg font-bold text-white">2. Utilisation et Badges Automatiques</h2>
          <p>
            Votre numéro est normalisé pour éviter les doublons. Le système génère automatiquement votre suffixe de clan BZK (🥷🏿 pour Garçon, 🌸 pour Fille) afin d'assurer l'authenticité de l'annuaire.
          </p>

          <h2 className="text-lg font-bold text-white">3. Masquage des Numéros & Accès Admin</h2>
          <p>
            Les numéros de téléphone complets ne sont jamais exposés publiquement aux autres utilisateurs sur leurs fiches ou statuts. Seul l'administrateur propriétaire dûment authentifié possède un accès à la liste complète des contacts.
          </p>

          <h2 className="text-lg font-bold text-white">4. Statuts Éphémères 24H</h2>
          <p>
            Les statuts publiés dans l'application expirent et disparaissent automatiquement après 24 heures. BZK FOLDER 🥷 BY KAYDO BZK 🥷 n'accède pas, ne scrape pas et n'interfère pas avec WhatsApp ou d'autres applications externes.
          </p>

          <h2 className="text-lg font-bold text-white">5. Suppression de Compte</h2>
          <p>
            Chaque membre peut à tout moment supprimer définitivement son compte et l'ensemble de ses données associées depuis son dashboard dans la rubrique "Supprimer mon compte".
          </p>
        </div>

      </div>
    </div>
  );
};
