import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/users';
import { Settings as SettingsIcon, Save, Camera, Globe, Lock, Shield, User as UserIcon } from 'lucide-react';

interface SettingsProps {
  onNavigate: (path: string) => void;
}

export const SettingsPage: React.FC<SettingsProps> = ({ onNavigate }) => {
  const { profile, reloadProfile, addToast } = useAuth();

  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [country, setCountry] = useState(profile?.country || 'Haïti (+509)');
  const [profilePhoto, setProfilePhoto] = useState(profile?.profilePhoto || '');
  const [statusSharingAllowed, setStatusSharingAllowed] = useState(
    profile?.statusSharingAllowed ?? true
  );
  const [saving, setSaving] = useState(false);

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Non Connecté</h2>
        <button onClick={() => onNavigate('/login')} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl">
          Se connecter
        </button>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile(profile.id, {
        firstName: firstName.trim(),
        country,
        profilePhoto: profilePhoto.trim(),
        statusSharingAllowed,
      });
      await reloadProfile();
      addToast('Profil mis à jour avec succès !', 'success');
    } catch (err: any) {
      addToast('Erreur lors de la mise à jour.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-purple-950/60 to-[#0d091a] border border-purple-500/30 backdrop-blur-2xl shadow-2xl space-y-6">
        
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-600/30 flex items-center justify-center text-purple-400">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Paramètres du Compte</h2>
            <p className="text-xs text-gray-400">Modifier vos informations et confidentialités.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
              Nom / Surnom
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-purple-500/20 text-white focus:outline-none focus:border-purple-500 transition text-sm"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              * Le badge <span className="text-purple-300 font-bold">{profile.badge}</span> est préservé automatiquement selon votre sexe.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
              Pays
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-purple-500/20 text-white focus:outline-none focus:border-purple-500 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
              URL Photo de Profil
            </label>
            <input
              type="url"
              value={profilePhoto}
              onChange={(e) => setProfilePhoto(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-purple-500/20 text-white focus:outline-none focus:border-purple-500 transition text-sm"
            />
          </div>

          {/* STATUS SHARING PREFERENCE TOGGLE */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-white">Partage de mes Statuts</div>
              <div className="text-xs text-gray-400">
                Autoriser la publication et le visionnage de statuts 24h.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStatusSharingAllowed(!statusSharingAllowed)}
              className={`w-12 h-6 rounded-full transition p-1 flex items-center ${
                statusSharingAllowed ? 'bg-purple-600 justify-end' : 'bg-gray-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Enregistrer les Modifications
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
};
