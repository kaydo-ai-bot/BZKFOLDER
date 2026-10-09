import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { getUserProfile } from '../services/users';
import { FolderKey, Globe, ShieldCheck, Calendar, Lock } from 'lucide-react';

interface PublicProfileProps {
  userId: string;
  onNavigate: (path: string) => void;
}

export const PublicProfile: React.FC<PublicProfileProps> = ({ userId, onNavigate }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getUserProfile(userId)
      .then((p) => {
        if (active) {
          setUserProfile(p);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Profil Introuvable</h2>
        <p className="text-gray-400 text-sm">Ce membre n'existe pas ou a supprimé son compte.</p>
        <button
          onClick={() => onNavigate('/')}
          className="px-6 py-2.5 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-500 text-sm"
        >
          Retour à l'Accueil
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fadeIn">
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-purple-950/70 to-[#0e0a1f] border border-purple-500/30 backdrop-blur-2xl shadow-2xl space-y-6 text-center relative overflow-hidden">
        
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-1 shadow-2xl shadow-purple-600/40 relative">
          {userProfile.profilePhoto ? (
            <img
              src={userProfile.profilePhoto}
              alt={userProfile.displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#15102a] rounded-full flex items-center justify-center text-purple-200 text-3xl font-black">
              {userProfile.firstName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-950 text-purple-200 border border-purple-400/50">
            {userProfile.badge}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase font-mono tracking-wider text-purple-400 font-bold mb-1">
            Membre Officiel BZK FOLDER 🥷 BY KAYDO BZK 🥷
          </div>
          <h1 className="text-2xl font-black text-white">{userProfile.displayName}</h1>
        </div>

        <div className="space-y-3 pt-2 text-left">
          
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-400 font-mono">Pays</div>
              <div className="text-sm font-semibold text-gray-200">{userProfile.country}</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-400 font-mono">Badge Certifié</div>
              <div className="text-sm font-semibold text-gray-200">{userProfile.badge}</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-pink-400 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-400 font-mono">Membre Depuis</div>
              <div className="text-xs font-semibold text-gray-200">
                {new Date(userProfile.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>

          {/* CONFIDENTIALITY NOTICE */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-2.5 text-xs text-indigo-200">
            <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Le numéro de téléphone complet de ce membre est protégé par la politique de confidentialité KAYDO FOLDER.
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
