import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { getUserProfile } from '../services/users';
import { downloadSingleBzkContact } from '../services/contactExporter';
import { useAuth } from '../context/AuthContext';
import { Globe, ShieldCheck, Phone, UserPlus, Lock, CheckCircle2 } from 'lucide-react';

interface BzkProfileProps {
  id: string;
  onNavigate: (path: string) => void;
}

export const BzkProfile: React.FC<BzkProfileProps> = ({ id, onNavigate }) => {
  const { addToast } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getUserProfile(id)
      .then((p) => {
        if (active) {
          setProfile(p);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Profil BZK Introuvable</h2>
        <p className="text-gray-400 text-sm">Ce membre n'existe pas ou a été désactivé.</p>
        <button
          onClick={() => onNavigate('/')}
          className="px-6 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 text-xs"
        >
          Retour à l'Accueil
        </button>
      </div>
    );
  }

  const handleAddBzk = () => {
    downloadSingleBzkContact(profile);
    addToast(`Fiche CONTACT BZK générée pour ${profile.displayName} !`, 'success');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fadeIn">
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-purple-950/70 to-[#0e0a1f] border border-purple-500/30 backdrop-blur-2xl shadow-2xl space-y-6 text-center">
        
        {/* AVATAR */}
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-1 shadow-2xl shadow-purple-600/40 relative">
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
          <div className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold bg-purple-950 text-purple-200 border border-purple-400/50">
            {profile.badge}
          </div>
        </div>

        {/* BZK NAME */}
        <div>
          <div className="text-[10px] uppercase font-mono tracking-wider text-purple-400 font-bold mb-1">
            Membre Certifié KAYDO FOLDER BZK
          </div>
          <h1 className="text-2xl font-black text-white">{profile.displayName}</h1>
        </div>

        {/* DETAILS */}
        <div className="space-y-3 pt-2 text-left text-xs">
          
          {/* PHONE (ONLY IF AUTHORIZED) */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <Phone className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-400 font-mono">Numéro</div>
              <div className="font-semibold text-gray-200 font-mono">
                {profile.phone ? profile.phone : 'Masqué par le propriétaire'}
              </div>
            </div>
          </div>

          {/* PAYS */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-400 font-mono">Pays</div>
              <div className="font-semibold text-gray-200">{profile.country}</div>
            </div>
          </div>

          {/* STATUT */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-400 font-mono">Statut</div>
              <div className="font-bold text-emerald-300">actif</div>
            </div>
          </div>

        </div>

        {/* ACTION BUTTON */}
        <div className="pt-2">
          <button
            onClick={handleAddBzk}
            className="w-full py-4 rounded-2xl text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-xl shadow-purple-600/30 border border-purple-400/30 transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            AJOUTER BZK
          </button>
        </div>

      </div>
    </div>
  );
};
