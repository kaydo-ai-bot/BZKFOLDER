import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatusItem } from '../types';
import { createStatus, getActiveStatuses, deleteStatus } from '../services/statuses';
import {
  Sparkles,
  PlusCircle,
  Clock,
  Trash2,
  Image as ImageIcon,
  Video,
  MessageSquare,
  X,
  Send,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';

interface StatusesProps {
  onNavigate: (path: string) => void;
}

export const Statuses: React.FC<StatusesProps> = ({ onNavigate }) => {
  const { profile, addToast } = useAuth();
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Status Modal State
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'text' | 'image' | 'video'>('text');
  const [publishing, setPublishing] = useState(false);

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const items = await getActiveStatuses();
      setStatuses(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      addToast('Veuillez vous connecter pour publier un statut.', 'error');
      return;
    }

    if (!content.trim()) {
      addToast('Veuillez ajouter un message à votre statut.', 'error');
      return;
    }

    setPublishing(true);
    try {
      await createStatus(profile, content, mediaUrl, mediaType);
      addToast('Statut publié pour 24 heures !', 'success');
      setShowModal(false);
      setContent('');
      setMediaUrl('');
      setMediaType('text');
      fetchStatuses();
    } catch (err: any) {
      addToast('Échec de la publication du statut.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (statusId: string) => {
    try {
      await deleteStatus(statusId);
      addToast('Statut supprimé.', 'info');
      setStatuses((prev) => prev.filter((s) => s.id !== statusId));
    } catch (e) {
      addToast('Erreur lors de la suppression.', 'error');
    }
  };

  // Calculate remaining hours
  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expiré';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m restantes`;
    return `${mins}m restantes`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Statuts Interne KAYDO FOLDER
          </div>
          <h1 className="text-3xl font-black text-white">Statuts 24 Heures</h1>
          <p className="text-sm text-gray-400">
            Fil d'actualité éphémère publié par les membres certifiés KAYDO FOLDER.
          </p>
        </div>

        {profile ? (
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-xl shadow-purple-600/30 border border-purple-400/30 transition flex items-center gap-2 shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            Publier un Statut
          </button>
        ) : (
          <button
            onClick={() => onNavigate('/login')}
            className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-200 bg-white/10 hover:bg-white/20 transition shrink-0"
          >
            Se connecter pour publier
          </button>
        )}
      </div>

      {/* NOTICE DISCLAIMER */}
      <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/20 text-xs text-purple-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Information :</strong> Les statuts affichés ci-dessus sont publiés volontairement par les membres dans KAYDO FOLDER. Notre système ne scrape pas et ne contourne pas WhatsApp.
        </p>
      </div>

      {/* STATUSES LIST */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400">Chargement des statuts en cours...</p>
        </div>
      ) : statuses.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white/5 border border-white/10 space-y-4">
          <MessageSquare className="w-12 h-12 text-purple-400/50 mx-auto" />
          <h3 className="text-lg font-bold text-white">Aucun statut actif</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Soyez le premier à partager une pensée, une photo ou une vidéo aujourd'hui !
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {statuses.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-3xl bg-gradient-to-b from-purple-950/50 to-[#0e0a1f] border border-purple-500/30 backdrop-blur-xl shadow-xl space-y-4 flex flex-col justify-between hover:border-purple-500/50 transition"
            >
              
              {/* STATUS USER HEADER */}
              <div className="flex items-center justify-between gap-3">
                <div
                  onClick={() => onNavigate(`/user/${item.userId}`)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-600/30 p-0.5 border border-purple-500/40">
                    {item.userPhoto ? (
                      <img src={item.userPhoto} alt={item.userDisplayName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#15102a] rounded-full flex items-center justify-center text-purple-300 font-bold text-sm">
                        {item.userDisplayName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-purple-300 transition">
                      {item.userDisplayName}
                    </div>
                    <div className="text-[10px] text-purple-400 font-mono">
                      {item.userBadge}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {getTimeRemaining(item.expiresAt)}
                  </span>

                  {profile && profile.id === item.userId && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-400 transition rounded-lg hover:bg-rose-500/10"
                      title="Supprimer mon statut"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* MEDIA PREVIEW IF ANY */}
              {item.mediaUrl && (
                <div className="rounded-2xl overflow-hidden bg-black/40 border border-white/10 max-h-64 flex items-center justify-center">
                  {item.mediaType === 'image' ? (
                    <img src={item.mediaUrl} alt="Statut" className="w-full h-full object-cover" />
                  ) : item.mediaType === 'video' ? (
                    <video src={item.mediaUrl} controls className="w-full h-full max-h-64 object-contain" />
                  ) : null}
                </div>
              )}

              {/* CONTENT TEXT */}
              <p className="text-sm text-gray-200 leading-relaxed font-medium whitespace-pre-wrap">
                {item.content}
              </p>

              {/* FOOTER TIMESTAMP */}
              <div className="text-[10px] text-gray-500 font-mono pt-2 border-t border-white/5">
                Publié le {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* CREATE STATUS MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-lg w-full p-6 sm:p-8 rounded-3xl bg-[#0f0b1f] border border-purple-500/40 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Nouveau Statut 24h
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublish} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                  Message du Statut
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Qu'avez-vous en tête aujourd'hui ?"
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-purple-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                  Type de Média (Optionnel)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaType('text')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                      mediaType === 'text' ? 'bg-purple-600/30 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Texte
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType('image')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                      mediaType === 'image' ? 'bg-purple-600/30 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType('video')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                      mediaType === 'video' ? 'bg-purple-600/30 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" /> Vidéo
                  </button>
                </div>
              </div>

              {mediaType !== 'text' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                    Lien / URL du fichier média
                  </label>
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-purple-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition text-sm"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={publishing}
                className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2"
              >
                {publishing ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Publier pour 24 Heures
                  </>
                )}
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
