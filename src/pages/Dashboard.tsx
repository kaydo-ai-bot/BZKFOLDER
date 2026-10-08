import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User as UserIcon,
  Phone,
  Globe,
  Calendar,
  ShieldCheck,
  Eye,
  Edit3,
  Settings,
  Lock,
  Trash2,
  Sparkles,
  Share2,
  Check,
} from 'lucide-react';
import { deleteUserProfile } from '../services/users';

interface DashboardProps {
  onNavigate: (path: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { profile, logoutUser, addToast } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Non Connecté</h2>
        <p className="text-gray-400 text-sm">Veuillez vous inscrire ou vous connecter pour accéder à votre espace.</p>
        <button
          onClick={() => onNavigate('/register')}
          className="px-6 py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 transition"
        >
          S'inscrire Maintenant
        </button>
      </div>
    );
  }

  // Helper to partially mask phone number
  const maskPhone = (phoneStr: string) => {
    if (!phoneStr || phoneStr.length < 8) return phoneStr;
    const len = phoneStr.length;
    return `${phoneStr.slice(0, 4)} **** ${phoneStr.slice(len - 2)}`;
  };

  const handleShareProfile = () => {
    const publicUrl = `${window.location.origin}/user/${profile.id}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    addToast('Lien de votre profil public copié !', 'success');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteUserProfile(profile.id);
      await logoutUser();
      addToast('Votre compte BZK FOLDER a été supprimé définitivement.', 'info');
      onNavigate('/');
    } catch (err: any) {
      addToast('Échec de la suppression du compte.', 'error');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* HEADER TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Mon Espace BZK FOLDER 🥷</h1>
          <p className="text-sm text-gray-400">
            Fiche officielle membre avec badge certifié.
          </p>
        </div>
        <button
          onClick={handleShareProfile}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-purple-200 bg-purple-950/60 border border-purple-500/30 hover:bg-purple-900/50 transition flex items-center gap-2 self-start sm:self-auto"
        >
          {copiedLink ? <Check className="w-4 h-4 text-cyan-400" /> : <Share2 className="w-4 h-4 text-purple-400" />}
          {copiedLink ? 'Lien Copié !' : 'Partager Mon Profil'}
        </button>
      </div>

      {/* MAIN PROFILE CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-purple-950/70 via-[#0e0a1f] to-[#0d091a] border border-purple-500/30 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          
          {/* AVATAR */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-1 shadow-2xl shadow-purple-600/40">
              {profile.profilePhoto ? (
                <img
                  src={profile.profilePhoto}
                  alt={profile.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#15102a] rounded-full flex items-center justify-center text-purple-200 text-3xl font-black">
                  {profile.firstName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="absolute -bottom-2 right-0 px-3 py-0.5 rounded-full text-xs font-extrabold bg-purple-950 text-purple-200 border border-purple-400/50 shadow-lg">
              {profile.badge}
            </div>
          </div>

          {/* USER INFO DETAILS */}
          <div className="flex-1 text-center md:text-left space-y-3">
            
            <div>
              <div className="text-xs uppercase font-mono tracking-wider text-purple-400 font-bold mb-0.5">
                Nom d'affichage officiel
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span>{profile.displayName}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <Phone className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="text-left">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">Numéro Masqué</div>
                  <div className="text-sm font-semibold text-gray-200 font-mono">
                    {maskPhone(profile.phone)}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="text-left">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">Pays</div>
                  <div className="text-sm font-semibold text-gray-200">
                    {profile.country}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="text-left">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">Sexe & Suffixe</div>
                  <div className="text-sm font-semibold text-gray-200 capitalize">
                    {profile.gender === 'male' ? 'Garçon 🥷🏿' : 'Fille 🌸'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <Calendar className="w-4 h-4 text-pink-400 shrink-0" />
                <div className="text-left">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">Date d'Inscription</div>
                  <div className="text-xs font-semibold text-gray-200">
                    {new Date(profile.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* DASHBOARD NAVIGATION BUTTONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        
        <button
          onClick={() => onNavigate(`/user/${profile.id}`)}
          className="p-5 rounded-2xl bg-white/5 hover:bg-purple-950/40 border border-white/10 hover:border-purple-500/40 transition text-left space-y-2 group"
        >
          <Eye className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-white text-base">MON PROFIL PUBLIC</div>
          <div className="text-xs text-gray-400">Voir la fiche visible par la communauté</div>
        </button>

        <button
          onClick={() => onNavigate('/settings')}
          className="p-5 rounded-2xl bg-white/5 hover:bg-purple-950/40 border border-white/10 hover:border-purple-500/40 transition text-left space-y-2 group"
        >
          <Edit3 className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-white text-base">MODIFIER MON PROFIL</div>
          <div className="text-xs text-gray-400">Changer nom, pays et photo</div>
        </button>

        <button
          onClick={() => onNavigate('/settings')}
          className="p-5 rounded-2xl bg-white/5 hover:bg-purple-950/40 border border-white/10 hover:border-purple-500/40 transition text-left space-y-2 group"
        >
          <Settings className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-white text-base">PARAMÈTRES</div>
          <div className="text-xs text-gray-400">Gérer mes préférences et statuts</div>
        </button>

        <button
          onClick={() => onNavigate('/privacy')}
          className="p-5 rounded-2xl bg-white/5 hover:bg-purple-950/40 border border-white/10 hover:border-purple-500/40 transition text-left space-y-2 group"
        >
          <Lock className="w-6 h-6 text-pink-400 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-white text-base">CONFIDENTIALITÉ</div>
          <div className="text-xs text-gray-400">Protection des numéros & RGPD</div>
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="p-5 rounded-2xl bg-rose-950/20 hover:bg-rose-950/50 border border-rose-500/30 transition text-left space-y-2 group col-span-1 sm:col-span-2 md:col-span-1"
        >
          <Trash2 className="w-6 h-6 text-rose-400 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-rose-300 text-base">SUPPRIMER MON COMPTE</div>
          <div className="text-xs text-rose-400/80">Action irréversible sur votre profil</div>
        </button>

      </div>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full p-6 rounded-3xl bg-[#120a1f] border border-rose-500/40 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white">Confirmer la suppression ?</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer votre compte BZK FOLDER ? Votre fiche et votre badge <span className="text-purple-300 font-bold">{profile.badge}</span> seront définitivement effacés.
            </p>
            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-white/10 text-gray-200 hover:bg-white/20 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-900/50"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
