import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getAllUsers, subscribeToUsers } from '../services/users';
import { downloadSingleBzkContact } from '../services/contactExporter';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  Globe,
  Calendar,
  Eye,
  Share2,
  UserPlus,
  ShieldCheck,
  Phone,
  Download,
} from 'lucide-react';

interface ContactsBzkProps {
  onNavigate: (path: string) => void;
}

export const ContactsBzk: React.FC<ContactsBzkProps> = ({ onNavigate }) => {
  const { addToast } = useAuth();
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToUsers((usersList) => {
      setContacts(usersList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filtered = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.displayName.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.badge.toLowerCase().includes(q)
    );
  });

  const handleShare = (c: UserProfile) => {
    const shareUrl = `${window.location.origin}/bzk/${c.id}`;
    navigator.clipboard.writeText(shareUrl);
    addToast(`Lien BZK de ${c.displayName} copié !`, 'success');
  };

  const handleAddBzkContact = (c: UserProfile) => {
    downloadSingleBzkContact(c);
    addToast(`Fiche CONTACT BZK générée pour ${c.displayName} !`, 'success');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" /> Répertoire Communautaire KAYDO FOLDER
          </div>
          <h1 className="text-3xl font-black text-white">MES BZK</h1>
          <p className="text-sm text-gray-400">
            Profils certifiés BZK enregistrés sur la plateforme.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('/download-bzk')}
            className="px-6 py-3 rounded-2xl text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-xl shadow-purple-600/30 border border-purple-400/30 transition flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            TÉLÉCHARGER MES BZK
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par nom BZK, pays..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 border border-purple-500/20 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-purple-500 transition"
        />
      </div>

      {/* CONTACTS GRID */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white/5 border border-white/10 text-gray-400 text-xs">
          Aucun contact BZK trouvé.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="p-6 rounded-3xl bg-gradient-to-b from-purple-950/50 to-[#0e0a1f] border border-purple-500/30 backdrop-blur-xl shadow-xl space-y-4 flex flex-col justify-between hover:border-purple-500/50 transition group"
            >
              
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shadow-md shrink-0">
                  {c.profilePhoto ? (
                    <img src={c.profilePhoto} alt={c.displayName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#15102a] rounded-full flex items-center justify-center text-purple-200 text-lg font-black">
                      {c.firstName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="overflow-hidden">
                  <h3 className="font-extrabold text-white text-base truncate group-hover:text-purple-300 transition">
                    {c.displayName}
                  </h3>
                  <div className="text-xs text-purple-400 font-mono font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    {c.badge}
                  </div>
                </div>
              </div>

              {/* DETAILS */}
              <div className="space-y-2 text-xs pt-2 border-t border-white/5">
                <div className="flex items-center justify-between text-gray-300">
                  <span className="flex items-center gap-1 text-gray-400"><Globe className="w-3.5 h-3.5 text-cyan-400" /> Pays :</span>
                  <span className="font-semibold">{c.country}</span>
                </div>

                <div className="flex items-center justify-between text-gray-300">
                  <span className="flex items-center gap-1 text-gray-400"><ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Statut :</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Actif
                  </span>
                </div>

                <div className="flex items-center justify-between text-gray-300">
                  <span className="flex items-center gap-1 text-gray-400"><Calendar className="w-3.5 h-3.5 text-pink-400" /> Inscription :</span>
                  <span className="font-mono text-[11px] text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                
                <button
                  onClick={() => onNavigate(`/bzk/${c.id}`)}
                  className="py-2.5 px-2 rounded-xl text-[11px] font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  VOIR LE PROFIL
                </button>

                <button
                  onClick={() => handleShare(c)}
                  className="py-2.5 px-2 rounded-xl text-[11px] font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-center gap-1"
                >
                  <Share2 className="w-3.5 h-3.5 text-purple-400" />
                  PARTAGER
                </button>

                <button
                  onClick={() => handleAddBzkContact(c)}
                  className="py-2.5 px-2 rounded-xl text-[11px] font-extrabold text-white bg-purple-600 hover:bg-purple-500 transition shadow-md flex items-center justify-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  AJOUTER
                </button>

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
