import React, { useState, useEffect } from 'react';
import { StatusItem } from '../../types';
import { getActiveStatuses, deleteStatus } from '../../services/statuses';
import { Sparkles, Trash2, Clock, MessageSquare, RefreshCw } from 'lucide-react';

export const AdminStatuses: React.FC = () => {
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
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
    fetchAll();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteStatus(id);
      setStatuses((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      alert('Erreur lors de la suppression.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" /> Modération des Statuts 24h
          </h1>
          <p className="text-xs text-gray-400">{statuses.length} statut(s) actif(s) sur la plateforme.</p>
        </div>
        <button onClick={fetchAll} className="p-2 bg-white/5 rounded-xl text-gray-300">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : statuses.length === 0 ? (
        <div className="p-8 text-center bg-white/5 rounded-2xl text-xs text-gray-400">
          Aucun statut actif à modérer.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statuses.map((s) => (
            <div key={s.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-white text-sm">{s.userDisplayName}</div>
                  <div className="text-[10px] text-purple-400 font-mono">{s.userBadge}</div>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                  title="Supprimer ce statut"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-200">{s.content}</p>
              {s.mediaUrl && (
                <div className="text-[10px] text-cyan-400 truncate">Média: {s.mediaUrl}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
