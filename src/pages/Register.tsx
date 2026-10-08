import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Gender } from '../types';
import { generateBadgeAndDisplayName } from '../services/users';
import {
  UserCheck,
  Phone,
  Globe,
  Sparkles,
  CheckCircle2,
  PlusCircle,
  Shield,
  Lock,
} from 'lucide-react';

interface RegisterProps {
  onNavigate: (path: string) => void;
}

const COUNTRIES = [
  { code: 'HT', name: 'Haïti (+509)' },
  { code: 'FR', name: 'France (+33)' },
  { code: 'CA', name: 'Canada (+1)' },
  { code: 'US', name: 'États-Unis (+1)' },
  { code: 'DO', name: 'République Dominicaine (+1)' },
  { code: 'CI', name: 'Côte d\'Ivoire (+225)' },
  { code: 'SN', name: 'Sénégal (+221)' },
  { code: 'CM', name: 'Cameroun (+237)' },
  { code: 'GA', name: 'Gabon (+241)' },
  { code: 'MA', name: 'Maroc (+212)' },
  { code: 'BE', name: 'Belgique (+32)' },
  { code: 'CH', name: 'Suisse (+41)' },
  { code: 'OTHER', name: 'Autre Pays' },
];

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { registerUserAccount, addToast } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Haïti (+509)');
  const [gender, setGender] = useState<Gender>('male');
  const [loading, setLoading] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState<{
    displayName: string;
    badge: string;
    phone: string;
  } | null>(null);

  // Live badge preview strictly using 🥷"nom"🥷BZK🌪️ for boys and 🌸"nom"🌸BZK🌪️ for girls
  const livePreview = generateBadgeAndDisplayName(firstName, gender);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      addToast('Veuillez entrer un numéro de téléphone valide.', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Enregistrement automatique et instantané du profil dans Firestore
      const user = await registerUserAccount({
        firstName: firstName.trim() || 'Membre',
        phone: phone.trim(),
        country,
        gender,
        consent: true,
      });

      // 2. Enregistrement réussi dans le folder KAYDO BZK (aucune redirection vers bot ou WhatsApp)
      setRegisteredSuccess({
        displayName: user?.displayName || livePreview.displayName,
        badge: user?.badge || livePreview.badge,
        phone: phone.trim(),
      });
      addToast('Enregistrement réussi dans le Folder BZK !', 'success');
    } catch (err: any) {
      addToast(err.message || 'Erreur lors de l\'enregistrement.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setFirstName('');
    setPhone('');
    setRegisteredSuccess(null);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-purple-950/70 via-[#0e0a1f] to-[#0d091a] border border-purple-500/30 backdrop-blur-2xl shadow-2xl space-y-6">
        
        {/* SUCCESS STATE */}
        {registeredSuccess ? (
          <div className="text-center space-y-6 py-4 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                ENREGISTREMENT RÉUSSI !
              </h2>
              <p className="text-sm text-gray-300 max-w-md mx-auto">
                Votre numéro a été automatiquement enregistré dans le <span className="text-purple-300 font-bold">BZK FOLDER 🥷 BY KAYDO BZK 🥷</span> avec votre identité officielle <span className="text-cyan-300 font-bold">BZK</span>.
              </p>
            </div>

            {/* IDENTITY CARD */}
            <div className="p-5 rounded-2xl bg-gradient-to-tr from-purple-950/60 to-indigo-950/60 border border-purple-500/40 space-y-3 text-left">
              <div className="text-[10px] font-mono text-purple-300 uppercase tracking-widest font-bold">
                Votre Identité Officielle BZK
              </div>
              <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>{registeredSuccess.displayName}</span>
              </div>
              <div className="text-xs font-mono text-cyan-300 bg-black/40 px-3 py-1.5 rounded-lg inline-block border border-white/10">
                Numéro enregistré : {registeredSuccess.phone}
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button
                onClick={handleResetForm}
                className="w-full py-4 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-xl shadow-purple-600/30 border border-purple-400/30 transition transform active:scale-95 flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-5 h-5" />
                ENREGISTRER UN AUTRE NUMÉRO
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shadow-lg shadow-purple-600/30">
                <div className="w-full h-full bg-[#0e0a1f] rounded-[14px] flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                ENREGISTREMENT BZK
              </h1>
              <p className="text-xs sm:text-sm text-gray-400">
                Enregistrez votre numéro pour recevoir automatiquement votre identité <span className="text-purple-300 font-bold">BZK</span> dans le folder.
              </p>
            </div>

            {/* LIVE BADGE PREVIEW BOX */}
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-mono text-purple-400 font-semibold">
                  Aperçu de votre identité BZK
                </div>
                <div className="text-lg font-extrabold text-white">
                  {livePreview.displayName}
                </div>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-200 border border-purple-500/40 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {livePreview.badge}
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* NOM */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                  Nom
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ex: Jean, David, Marie, Sarah..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-purple-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition text-sm"
                />
              </div>

              {/* SEXE */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                  Sexe
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition ${
                      gender === 'male'
                        ? 'bg-purple-600/30 border-purple-500 text-white shadow-lg shadow-purple-900/40'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <span>🥷 GARÇON</span>
                    <span className="text-[10px] font-mono text-purple-300">🥷 KAYDO 𝑩𝒁𝑲 🌪️</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition ${
                      gender === 'female'
                        ? 'bg-pink-600/30 border-pink-500 text-white shadow-lg shadow-pink-900/40'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <span>🌸 FILLE</span>
                    <span className="text-[10px] font-mono text-pink-300">🌸 SARAH 𝑩𝒁𝑲 🌪️</span>
                  </button>
                </div>
              </div>

              {/* NUMÉRO */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                  Numéro de Téléphone
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+509 34 12 3456"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-purple-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition text-sm font-mono"
                  />
                </div>
              </div>

              {/* PAYS */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                  Pays
                </label>
                <div className="relative">
                  <Globe className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#120e24] border border-purple-500/20 text-white focus:outline-none focus:border-purple-500 transition text-sm appearance-none"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name} className="bg-[#120e24] text-white">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-xl shadow-purple-600/30 border border-purple-400/30 transition transform active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enregistrement automatique en cours...
                  </span>
                ) : (
                  <>
                    ENREGISTRER MON NUMÉRO AU FOLDER
                  </>
                )}
              </button>

            </form>

            <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-gray-500 font-mono">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Système sécurisé KAYDO BZK • Confidentialité garantie</span>
            </div>

            {/* DIRECT OWNER/ADMIN ACCESS BUTTON */}
            <div className="pt-4 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={() => onNavigate('/admin/login')}
                className="w-full py-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-mono font-bold transition flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>🔑 ENTRER LE CODE ADMINISTRATEUR / PROPRIÉTAIRE</span>
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
