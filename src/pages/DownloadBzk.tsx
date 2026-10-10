import React, { useState, useEffect } from 'react';
import { getAllUsers, checkPhoneExists, normalizePhoneNumber } from '../services/users';
import { downloadAllBzkContacts } from '../services/contactExporter';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import {
  Download,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Smartphone,
  Globe,
  Sparkles,
  UserCheck,
  UserPlus,
  ArrowRight,
  Lock,
  RefreshCw,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';

interface DownloadBzkProps {
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

export const DownloadBzk: React.FC<DownloadBzkProps> = ({ onNavigate }) => {
  const { addToast } = useAuth();
  // NEVER prefill the phone number - the user must type it themselves!
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Haïti (+509)');
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadedCount, setDownloadedCount] = useState<number | null>(null);
  const [verifiedUser, setVerifiedUser] = useState<UserProfile | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [deniedPhone, setDeniedPhone] = useState('');
  const [totalDatabaseContacts, setTotalDatabaseContacts] = useState<number | null>(null);

  // Load total count on mount
  useEffect(() => {
    let isMounted = true;
    getAllUsers()
      .then((users) => {
        if (isMounted) {
          setTotalDatabaseContacts(users.length);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleVerifyAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed) {
      addToast('Veuillez entrer votre numéro de téléphone.', 'error');
      return;
    }

    setChecking(true);
    setAccessDenied(false);
    setVerifiedUser(null);
    setDownloadedCount(null);

    try {
      const match = await checkPhoneExists(trimmed, country);

      if (match) {
        setVerifiedUser(match);
        setAccessDenied(false);
        addToast(`Accès autorisé ! Bienvenue ${match.displayName}`, 'success');
      } else {
        setAccessDenied(true);
        setDeniedPhone(trimmed);
        addToast("Accès refusé : Ce numéro n'est pas encore enregistré dans le fichier BZK.", 'error');
      }
    } catch (err: any) {
      addToast(err?.message || 'Erreur lors de la vérification du numéro.', 'error');
    } finally {
      setChecking(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!verifiedUser) {
      addToast('Veuillez d\'abord valider votre numéro de téléphone.', 'error');
      return;
    }

    setDownloading(true);
    setDownloadedCount(null);
    try {
      const contacts = await getAllUsers();
      if (!contacts || contacts.length === 0) {
        addToast('Aucun contact BZK disponible dans la base.', 'error');
        setDownloading(false);
        return;
      }

      // Download all contacts in VCF format
      downloadAllBzkContacts(contacts);
      setDownloadedCount(contacts.length);
      setTotalDatabaseContacts(contacts.length);
      addToast(`${contacts.length} contact(s) BZK téléchargé(s) avec succès !`, 'success');
    } catch (e) {
      addToast('Échec de la génération du fichier BZK.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleResetVerification = () => {
    setVerifiedUser(null);
    setAccessDenied(false);
    setDownloadedCount(null);
    setPhone('');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* MAIN CONTAINER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-purple-950/70 via-[#0e0a1f] to-[#0c0818] border border-purple-500/30 backdrop-blur-2xl shadow-2xl space-y-6">
        
        {/* TOP EMBLEM */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-xl shadow-purple-600/30">
            <div className="w-full h-full bg-[#100a20] rounded-[14px] flex items-center justify-center">
              <Download className="w-8 h-8 text-cyan-400" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              TÉLÉCHARGER LE FICHIER BZK
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto pt-1 leading-relaxed">
              Téléchargez le fichier <span className="text-purple-300 font-mono font-bold">KAYDO_BZK_CONTACTS.vcf</span> pour enregistrer automatiquement tous les membres BZK dans votre smartphone.
            </p>
          </div>

          {/* PERMANENCE GUARANTEE BADGE */}
          <div className="p-3.5 rounded-2xl bg-purple-950/50 border border-purple-500/30 text-xs text-purple-200 text-left flex items-start gap-2.5 shadow-inner">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-white uppercase tracking-wide">Règle de Sauvegarde Permanente :</span>{' '}
              Même après avoir téléchargé le fichier, tous les numéros restent en permanence conservés sur le site pour la prochaine version. Aucun contact n'est jamais supprimé.
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CASE 1: ACCESS DENIED (NUMBER NOT IN FILE)                               */}
        {/* ========================================================================= */}
        {accessDenied && !verifiedUser && (
          <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-left space-y-4 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">
                  ACCÈS REFUSÉ — NUMÉRO INTROUVABLE DANS LE FICHIER
                </h3>
                <p className="text-xs text-rose-200/90 leading-relaxed">
                  Le numéro <span className="font-mono font-bold text-white bg-black/40 px-2 py-0.5 rounded border border-rose-500/30">{deniedPhone}</span> n'est pas encore enregistré dans le fichier BZK.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-rose-500/30 text-xs text-gray-300 space-y-2">
              <div className="font-bold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Condition obligatoire pour télécharger le fichier :
              </div>
              <p className="text-[11px] text-gray-300">
                Vous devez d'abord enregistrer votre propre numéro pour recevoir votre identité <span className="text-purple-300 font-bold">𝑩𝒁𝑲 🌪️</span> et être ajouté au répertoire avant de pouvoir télécharger les contacts des autres membres.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={() => onNavigate('/register')}
                className="flex-1 py-3.5 px-5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-950 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>ENREGISTRER MON NUMÉRO AU FOLDER</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleResetVerification}
                className="py-3.5 px-4 rounded-xl font-bold text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Essayer un autre numéro</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE 2: ACCESS GRANTED (NUMBER IS REGISTERED IN THE FILE)                */}
        {/* ========================================================================= */}
        {verifiedUser && (
          <div className="space-y-5 animate-fadeIn">
            
            {/* SUCCESS VERIFICATION CARD */}
            <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-left space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accès Autorisé — Numéro Vérifié dans le Fichier BZK</span>
                </div>
                <button
                  onClick={handleResetVerification}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 hover:underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Changer</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-mono text-emerald-400 font-bold">
                    Membre Officiel BZK
                  </div>
                  <div className="text-lg font-black text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>{verifiedUser.displayName}</span>
                  </div>
                  <div className="text-xs font-mono text-zinc-300">
                    Numéro : <span className="text-cyan-300 font-bold">{verifiedUser.phoneNormalized || verifiedUser.phone}</span> ({verifiedUser.country})
                  </div>
                </div>

                <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold self-start sm:self-center">
                  {verifiedUser.badge}
                </div>
              </div>
            </div>

            {/* DOWNLOAD BUTTON */}
            <div className="pt-2 flex flex-col items-center justify-center gap-3">
              <button
                onClick={handleDownloadAll}
                disabled={downloading}
                className="w-full py-4.5 px-8 rounded-2xl text-sm sm:text-base font-black text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-xl shadow-purple-600/30 border border-purple-400/30 transition transform active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
              >
                {downloading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Génération du fichier VCF en cours...
                  </span>
                ) : (
                  <>
                    <Download className="w-5 h-5 text-cyan-300" />
                    <span>
                      TÉLÉCHARGER LE FICHIER BZK (.VCF)
                      {totalDatabaseContacts !== null ? ` (${totalDatabaseContacts} CONTACTS)` : ''}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* CONFIRMATION CARD IF DOWNLOADED */}
            {downloadedCount !== null && (
              <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-3 text-left animate-fadeIn shadow-lg">
                <FileCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-white text-sm">Fichier BZK Téléchargé avec Succès !</div>
                  <div className="text-[11px] text-emerald-300/90 pt-0.5">
                    {downloadedCount} contacts BZK inclus dans le fichier. Ouvrez le fichier téléchargé depuis vos notifications ou gestionnaire de fichiers pour importer tous les contacts dans votre téléphone.
                  </div>
                </div>
              </div>
            )}

            {/* INSTRUCTIONS */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-300 text-left space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                Comment importer les contacts sur votre smartphone :
              </div>
              <ol className="list-decimal list-inside space-y-1 text-gray-300 text-[11px] leading-relaxed">
                <li>Appuyez sur le bouton ci-dessus pour télécharger le fichier <span className="text-purple-300 font-mono font-bold">.vcf</span>.</li>
                <li>Ouvrez le fichier téléchargé depuis le dossier Téléchargements de votre téléphone.</li>
                <li>Votre application Contacts vous proposera d'enregistrer tous les contacts BZK en un seul clic !</li>
              </ol>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* CASE 3: PHONE VERIFICATION FORM (BEFORE DOWNLOAD)                        */}
        {/* ========================================================================= */}
        {!verifiedUser && !accessDenied && (
          <div className="space-y-4 pt-2">
            
            <div className="p-4 rounded-2xl bg-purple-900/20 border border-purple-500/30 text-left space-y-1">
              <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Vérification d'accès requise</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Entrez le numéro de téléphone avec lequel vous êtes enregistré dans le folder. Si votre numéro est présent dans le fichier, l'accès au téléchargement complet vous sera immédiatement débloqué.
              </p>
            </div>

            <form onSubmit={handleVerifyAccess} className="space-y-4 text-left">
              
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

              {/* NUMÉRO DE TÉLÉPHONE */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                  Votre Numéro de Téléphone
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+509 35 97 5863 ou 35975863"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-purple-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition text-sm font-mono"
                  />
                </div>
                <div className="text-[10px] text-gray-400 pt-1">
                  💡 Fonctionne avec n'importe quel format : <span className="font-mono text-purple-300">+50935975863</span>, <span className="font-mono text-purple-300">50935975863</span> ou <span className="font-mono text-purple-300">35975863</span>.
                </div>
              </div>

              {/* VÉRIFIER ACCÈS BUTTON */}
              <button
                type="submit"
                disabled={checking}
                className="w-full py-4 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-xl shadow-purple-600/30 border border-purple-400/30 transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {checking ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Vérification du numéro dans le fichier BZK...
                  </span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-cyan-300" />
                    <span>VÉRIFIER MON ACCÈS AU FICHIER BZK</span>
                  </>
                )}
              </button>

            </form>

            {/* NOT REGISTERED YET LINK */}
            <div className="pt-2 text-center">
              <p className="text-xs text-gray-400">
                Vous n'avez pas encore enregistré votre numéro ?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('/register')}
                  className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>S'enregistrer maintenant</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </p>
            </div>

          </div>
        )}

        {/* OWNER/ADMIN DIRECT SHORTCUT */}
        <div className="pt-4 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={() => onNavigate('/admin/login')}
            className="w-full py-3 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/20 text-purple-300 hover:text-white text-xs font-mono font-bold transition flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>🔑 ESPACE ADMINISTRATEUR / PROPRIÉTAIRE</span>
          </button>
        </div>

      </div>

    </div>
  );
};
