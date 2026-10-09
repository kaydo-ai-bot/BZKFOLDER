import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { getAdminContacts, deleteAdminContact, clearAllAdminContacts, updateAdminContact } from '../../services/users';
import { downloadAllBzkContacts } from '../../services/contactExporter';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Filter,
  Trash2,
  Download,
  Phone,
  Users,
  UserCheck,
  Calendar,
  RefreshCw,
  LogOut,
  FolderDown,
  Copy,
  Check,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';

interface AdminContactsProps {
  onNavigate: (path: string) => void;
}

export const AdminContacts: React.FC<AdminContactsProps> = ({ onNavigate }) => {
  const { addToast, logoutAdminSession } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modals state
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const data = await getAdminContacts();
      setUsers(data);
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') {
        addToast('Session expirée. Veuillez vous reconnecter.', 'error');
        onNavigate('/admin');
      } else {
        addToast('Impossible de charger les contacts.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleLogout = async () => {
    await logoutAdminSession();
    onNavigate('/');
  };

  // Copy phone number
  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    addToast(`Numéro copié : ${phone}`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter Logic
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.firstName || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.phoneNormalized || '').toLowerCase().includes(q) ||
      (u.country || '').toLowerCase().includes(q);

    const matchesGender = genderFilter === 'all' || u.gender === genderFilter;
    const matchesCountry = countryFilter === 'all' || u.country === countryFilter;

    return matchesSearch && matchesGender && matchesCountry;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteContact = async () => {
    if (!selectedUser) return;
    try {
      await deleteAdminContact(selectedUser.id);
      setShowDeleteModal(false);
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      addToast(`Contact supprimé avec succès.`, 'success');
    } catch {
      addToast('Échec de la suppression.', 'error');
    }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      const count = await clearAllAdminContacts();
      setShowClearAllModal(false);
      setUsers([]);
      addToast(`${count} contacts supprimés. Le folder a été réinitialisé.`, 'success');
    } catch {
      addToast('Échec de la réinitialisation.', 'error');
    } finally {
      setClearing(false);
    }
  };

  const handleExportVcf = () => {
    if (!users || users.length === 0) {
      addToast('Aucun contact disponible pour l\'export.', 'error');
      return;
    }
    downloadAllBzkContacts(users);
    addToast(`Export VCF réussi (${users.length} contacts). Tous les numéros restent en permanence sur le site !`, 'success');
  };

  const handleExportCsv = () => {
    if (!users || users.length === 0) {
      addToast('Aucun contact disponible pour l\'export.', 'error');
      return;
    }
    const headers = 'Nom,Numéro,Pays,Sexe,Date Inscription\n';
    const rows = users
      .map(
        (u) =>
          `"${(u.displayName || u.firstName || '').replace(/"/g, '""')}","${u.phone || ''}","${u.country || ''}","${u.gender || ''}","${u.createdAt || ''}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BZK_CONTACTS_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast(`Export CSV réussi (${users.length} contacts). Tous les numéros restent en permanence sur le site !`, 'success');
  };

  // Statistics Calculation
  const totalInscrits = users.length;
  const totalNumeros = users.filter((u) => !!u.phone).length;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dernieresInscriptions = users.filter((u) => {
    const createdTime = new Date(u.createdAt).getTime();
    return createdTime >= startOfToday;
  }).length;

  const totalBoys = users.filter((u) => u.gender === 'male').length;
  const totalGirls = users.filter((u) => u.gender === 'female').length;
  const countriesList = Array.from(new Set(users.map((u) => u.country))).filter(Boolean);

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto px-2 sm:px-4 pb-12">
      
      {/* ======================================================== */}
      {/* HEADER: BZK FOLDER - OWNER PANEL */}
      {/* ======================================================== */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0c140f] via-[#101b14] to-[#0a110c] border border-emerald-500/30 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              ACCÈS PROPRIÉTAIRE AUTHENTIFIÉ
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase mt-1">
            BZK FOLDER
          </h1>
          <div className="text-xs font-mono text-zinc-400 font-bold uppercase tracking-wider">
            OWNER PANEL • GESTION DU RÉPERTOIRE
          </div>
        </div>

        {/* TOP ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={fetchContacts}
            disabled={loading}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-emerald-500/20 text-zinc-300 hover:text-white transition cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportVcf}
            className="px-4 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            title="Exporter le carnet d'adresses VCF"
          >
            <FolderDown className="w-4 h-4 text-emerald-400" />
            <span>EXPORTER VCF</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 hover:text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            title="Exporter au format Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-zinc-400" />
            <span>EXPORT CSV</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>DÉCONNEXION</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PERMANENT STORAGE GUARANTEE BANNER */}
      {/* ======================================================== */}
      <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold text-white">Sauvegarde permanente active : </span>
            <span>Tous les numéros ({totalInscrits}) restent enregistrés sur le site pour la prochaine version. L'exportation de contacts (VCF/CSV) ne supprime aucun numéro.</span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0 hidden sm:inline-block">
          100% SÉCURISÉ
        </span>
      </div>

      {/* ======================================================== */}
      {/* METRIC COUNTERS: TOTAL INSCRITS | TOTAL NUMÉROS | DERNIÈRES */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* TOTAL INSCRITS */}
        <div className="p-5 rounded-2xl bg-[#0c140f] border border-emerald-500/25 shadow-lg space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400 flex items-center justify-between">
            <span>TOTAL INSCRITS</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{totalInscrits}</div>
          <div className="text-[11px] text-zinc-400">Membres enregistrés</div>
        </div>

        {/* TOTAL NUMÉROS */}
        <div className="p-5 rounded-2xl bg-[#0c140f] border border-emerald-500/25 shadow-lg space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400 flex items-center justify-between">
            <span>TOTAL NUMÉROS</span>
            <Phone className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{totalNumeros}</div>
          <div className="text-[11px] text-zinc-400">Numéros protégés</div>
        </div>

        {/* DERNIÈRES INSCRIPTIONS */}
        <div className="p-5 rounded-2xl bg-[#0c140f] border border-emerald-500/25 shadow-lg space-y-1">
          <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400 flex items-center justify-between">
            <span>DERNIÈRES INSCRIPTIONS</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-300">
            {dernieresInscriptions}
          </div>
          <div className="text-[11px] text-zinc-400">Aujourd'hui</div>
        </div>

        {/* RÉPARTITION SEXE */}
        <div className="p-5 rounded-2xl bg-[#0c140f] border border-emerald-500/25 shadow-lg space-y-2">
          <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400 flex items-center justify-between">
            <span>RÉPARTITION BZK</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between text-xs font-mono font-bold pt-1">
            <span className="text-zinc-200">🥷 Garçons: {totalBoys}</span>
            <span className="text-pink-300">🌸 Filles: {totalGirls}</span>
          </div>
          <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full"
              style={{ width: `${totalInscrits ? (totalBoys / totalInscrits) * 100 : 50}%` }}
            />
            <div
              className="bg-pink-400 h-full"
              style={{ width: `${totalInscrits ? (totalGirls / totalInscrits) * 100 : 50}%` }}
            />
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* SEARCH AND FILTERS */}
      {/* ======================================================== */}
      <div className="p-4 rounded-2xl bg-[#0c140f] border border-emerald-500/20 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* SEARCH */}
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher par nom, numéro, pays..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070d09] border border-emerald-500/25 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* GENDER FILTER */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#070d09] border border-emerald-500/25 text-xs font-bold">
            <button
              onClick={() => { setGenderFilter('all'); setCurrentPage(1); }}
              className={`flex-1 py-1.5 rounded-lg transition ${
                genderFilter === 'all' ? 'bg-emerald-500/30 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tous ({users.length})
            </button>
            <button
              onClick={() => { setGenderFilter('male'); setCurrentPage(1); }}
              className={`flex-1 py-1.5 rounded-lg transition ${
                genderFilter === 'male' ? 'bg-emerald-500/30 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              🥷 Garçons ({totalBoys})
            </button>
            <button
              onClick={() => { setGenderFilter('female'); setCurrentPage(1); }}
              className={`flex-1 py-1.5 rounded-lg transition ${
                genderFilter === 'female' ? 'bg-emerald-500/30 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              🌸 Filles ({totalGirls})
            </button>
          </div>

          {/* COUNTRY FILTER */}
          <div>
            <select
              value={countryFilter}
              onChange={(e) => {
                setCountryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-[#070d09] border border-emerald-500/25 text-white text-xs focus:outline-none focus:border-emerald-400"
            >
              <option value="all">Tous les pays ({countriesList.length})</option>
              {countriesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* DATA PRESENTATION: TABLE (DESKTOP) + CARDS (MOBILE) */}
      {/* ======================================================== */}
      <div className="rounded-2xl bg-[#0c140f] border border-emerald-500/20 overflow-hidden shadow-xl">
        
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <div className="text-sm font-mono text-zinc-400">Chargement des numéros protégés...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Users className="w-10 h-10 text-zinc-600 mx-auto" />
            <div className="text-sm font-bold text-zinc-300">Aucun contact trouvé</div>
            <div className="text-xs text-zinc-500">Modifiez votre recherche ou vos filtres.</div>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE (VISIBLE ON MD AND ABOVE) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#080e0a] text-zinc-400 uppercase font-mono font-bold tracking-wider border-b border-emerald-500/20">
                  <tr>
                    <th className="py-3.5 px-4">NOM</th>
                    <th className="py-3.5 px-4">NUMÉRO</th>
                    <th className="py-3.5 px-4">PAYS</th>
                    <th className="py-3.5 px-4">SEXE</th>
                    <th className="py-3.5 px-4">DATE</th>
                    <th className="py-3.5 px-4">STATUT</th>
                    <th className="py-3.5 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition">
                      
                      {/* NOM */}
                      <td className="py-3 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span>{user.displayName || user.firstName}</span>
                        </div>
                      </td>

                      {/* NUMÉRO */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-300">
                        <div className="flex items-center gap-2">
                          <span>{user.phone}</span>
                          <button
                            onClick={() => handleCopyPhone(user.phone, user.id)}
                            className="p-1 text-zinc-500 hover:text-emerald-300 rounded transition"
                            title="Copier le numéro"
                          >
                            {copiedId === user.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* PAYS */}
                      <td className="py-3 px-4 text-zinc-300">
                        {user.country || 'Non spécifié'}
                      </td>

                      {/* SEXE */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                            user.gender === 'female'
                              ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {user.gender === 'female' ? 'FILLE' : 'GARÇON'}
                        </span>
                      </td>

                      {/* DATE */}
                      <td className="py-3 px-4 font-mono text-zinc-400 text-[11px]">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* STATUT */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                          {user.status || 'Actif'}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW: ADAPTIVE CARDS FOR ANDROID / PHONES */}
            <div className="md:hidden divide-y divide-white/5 p-2 space-y-2">
              {paginatedUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-4 rounded-xl bg-[#070d09] border border-emerald-500/15 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                        <span>{user.displayName || user.firstName}</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {user.country}
                      </div>
                    </div>
                    
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold ${
                        user.gender === 'female'
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {user.gender === 'female' ? 'FILLE' : 'GARÇON'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {user.phone}
                    </span>
                    <button
                      onClick={() => handleCopyPhone(user.phone, user.id)}
                      className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-300 flex items-center gap-1"
                    >
                      {copiedId === user.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copié</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1">
                    <span>
                      Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowDeleteModal(true);
                      }}
                      className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* PAGINATION */}
            <div className="p-4 border-t border-emerald-500/20 flex items-center justify-between text-xs font-mono text-zinc-400">
              <div>
                Affichage {(currentPage - 1) * itemsPerPage + 1} -{' '}
                {Math.min(currentPage * itemsPerPage, filteredUsers.length)} sur{' '}
                {filteredUsers.length}
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-white/5 disabled:opacity-30 hover:bg-white/10 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-white">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-white/5 disabled:opacity-30 hover:bg-white/10 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

      </div>

      {/* DANGER ZONE: CLEAR ALL FOLDER */}
      <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-rose-300 uppercase tracking-wider">
            Zone Sensible Propriétaire
          </div>
          <div className="text-[11px] text-zinc-400">
            Supprimer l'intégralité des numéros enregistrés et réinitialiser le folder.
          </div>
        </div>
        <button
          onClick={() => setShowClearAllModal(true)}
          className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition cursor-pointer"
        >
          RÉINITIALISER LE FOLDER
        </button>
      </div>

      {/* DELETE SINGLE MODAL */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#0e1611] border border-rose-500/40 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Confirmer la suppression</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement le contact{' '}
              <strong className="text-white font-mono">{selectedUser.displayName}</strong> ({selectedUser.phone}) ?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-zinc-300 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteContact}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR ALL MODAL */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#0e1611] border border-rose-500/40 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Réinitialisation du Folder</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Attention : cette action va supprimer <strong className="text-white">{users.length} contacts</strong> définitivement de la base de données.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-zinc-300 transition"
              >
                Annuler
              </button>
              <button
                disabled={clearing}
                onClick={handleClearAll}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition"
              >
                {clearing ? 'Suppression...' : 'Tout supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
