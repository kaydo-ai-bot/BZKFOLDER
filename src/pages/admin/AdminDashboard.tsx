import React, { useState, useEffect } from 'react';
import { UserProfile, StatusItem, AdminStats } from '../../types';
import { getAllUsers, subscribeToUsers } from '../../services/users';
import { getActiveStatuses } from '../../services/statuses';
import {
  Users,
  UserCheck,
  Sparkles,
  Calendar,
  TrendingUp,
  Brain,
  Globe,
  PieChart,
  RefreshCw,
  Share2,
  UserPlus,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Analytics State
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const loadData = async () => {
    try {
      const allS = await getActiveStatuses();
      setStatuses(allS || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
    const unsubscribe = subscribeToUsers((usersList) => {
      setUsers(usersList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Compute metrics
  const totalBzk = users.length;
  const bzkHommes = users.filter((u) => u.gender === 'male').length;
  const bzkFemmes = users.filter((u) => u.gender === 'female').length;
  const bzkActifs = users.filter((u) => u.isActive !== false).length;
  const partagesBzk = statuses.length + users.reduce((acc, u) => acc + (u.sharesCount || 1), 0);
  const ajoutsBzk = users.reduce((acc, u) => acc + (u.addsCount || 1), 0);

  // Nouveaux BZK (aujourd'hui)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const nouveauxBzk = users.filter((u) => new Date(u.createdAt).getTime() >= startOfToday).length;

  // Country Breakdown
  const countryBreakdown: Record<string, number> = {};
  users.forEach((u) => {
    const c = u.country || 'Inconnu';
    countryBreakdown[c] = (countryBreakdown[c] || 0) + 1;
  });

  const statsPayload: AdminStats = {
    totalContacts: totalBzk,
    maleContacts: bzkHommes,
    femaleContacts: bzkFemmes,
    newToday: nouveauxBzk,
    newThisWeek: users.length,
    activeAccounts: bzkActifs,
    sharedStatuses: partagesBzk,
    countryBreakdown,
  };

  const handleGenerateAiAnalytics = async () => {
    setLoadingAi(true);
    setAiAnalysis(null);
    try {
      const res = await fetch('/api/admin/ai-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats: statsPayload }),
      });
      const data = await res.json();
      if (res.ok && data.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        setAiAnalysis('Impossible de générer l\'analyse BZK par l\'IA pour le moment.');
      }
    } catch (e) {
      setAiAnalysis('Erreur réseau lors de l\'appel de l\'IA.');
    } finally {
      setLoadingAi(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-gray-400">Chargement du tableau BZK...</p>
      </div>
    );
  }

  const malePercent = totalBzk > 0 ? Math.round((bzkHommes / totalBzk) * 100) : 0;
  const femalePercent = totalBzk > 0 ? Math.round((bzkFemmes / totalBzk) * 100) : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* HEADER & REFRESH */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white uppercase">BZK FOLDER ADMIN</h1>
          <p className="text-xs text-gray-400">Vue d'ensemble du réseau BZK FOLDER 🥷 BY KAYDO BZK 🥷.</p>
        </div>
        <button
          onClick={loadData}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition"
          title="Actualiser les BZK"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-gradient-to-b from-purple-950/40 to-[#0e0a1f] border border-purple-500/30 backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider">TOTAL BZK</span>
            <Users className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-white">{totalBzk}</div>
          <div className="text-[11px] text-gray-400">Profils BZK créés</div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-[#0e0a1f] border border-indigo-500/30 backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider">BZK HOMMES</span>
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-white">{bzkHommes}</div>
          <div className="text-[11px] text-indigo-300">BZK 🥷🏿 ({malePercent}%)</div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-b from-pink-950/40 to-[#0e0a1f] border border-pink-500/30 backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between text-pink-400">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider">BZK FEMMES</span>
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-white">{bzkFemmes}</div>
          <div className="text-[11px] text-pink-300">BZK 🌸 ({femalePercent}%)</div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-[#0e0a1f] border border-emerald-500/30 backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider">BZK ACTIFS</span>
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-white">{bzkActifs}</div>
          <div className="text-[11px] text-emerald-300">Comptes validés</div>
        </div>

      </div>

      {/* SECONDARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-400 font-mono uppercase font-bold">NOUVEAUX BZK</div>
            <div className="text-xl font-black text-white">{nouveauxBzk}</div>
          </div>
          <Calendar className="w-6 h-6 text-purple-400" />
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-400 font-mono uppercase font-bold">PARTAGES BZK</div>
            <div className="text-xl font-black text-white">{partagesBzk}</div>
          </div>
          <Share2 className="w-6 h-6 text-cyan-400" />
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-400 font-mono uppercase font-bold">AJOUTS BZK</div>
            <div className="text-xl font-black text-white">{ajoutsBzk}</div>
          </div>
          <UserPlus className="w-6 h-6 text-indigo-400" />
        </div>

      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-950/40 to-[#0e0a1f] border border-purple-500/20 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-400" />
            Répartition BZK Garçons / Filles
          </h3>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-300 mb-1">
                <span>BZK 🥷🏿 (Garçons)</span>
                <span>{bzkHommes} ({malePercent}%)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${malePercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-300 mb-1">
                <span>BZK 🌸 (Filles)</span>
                <span>{bzkFemmes} ({femalePercent}%)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${femalePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-950/40 to-[#0e0a1f] border border-purple-500/20 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            Répartition BZK par Pays
          </h3>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {Object.entries(countryBreakdown).map(([cName, count]) => (
              <div key={cName} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white/5">
                <span className="font-medium text-gray-200">{cName}</span>
                <span className="font-bold text-cyan-300 font-mono">{count} BZK</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* GEMINI AI ANALYTICS */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-rose-950 border border-rose-500/30 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-rose-400" />
              IA Analytics BZK
            </h3>
            <p className="text-xs text-gray-300">
              Générez une analyse anonymisée de l'évolution du réseau BZK FOLDER 🥷 BY KAYDO BZK 🥷.
            </p>
          </div>

          <button
            onClick={handleGenerateAiAnalytics}
            disabled={loadingAi}
            className="px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 transition shadow-lg shrink-0 flex items-center gap-2"
          >
            {loadingAi ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Analyse IA BZK
              </>
            )}
          </button>
        </div>

        {aiAnalysis && (
          <div className="p-5 rounded-2xl bg-black/50 border border-rose-500/30 text-xs text-gray-200 font-mono leading-relaxed whitespace-pre-wrap animate-fadeIn">
            {aiAnalysis}
          </div>
        )}
      </div>

    </div>
  );
};
