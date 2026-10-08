import React, { useState } from 'react';
import { getAllUsers } from '../../services/users';
import { downloadAllBzkContacts } from '../../services/contactExporter';
import { Download, FileSpreadsheet, FileCode, History } from 'lucide-react';

export const AdminExports: React.FC = () => {
  const [downloadingFormat, setDownloadingFormat] = useState<'contacts' | 'data' | null>(null);
  const [exportLogs, setExportLogs] = useState<Array<{ date: string; label: string; count: number }>>([]);

  const handleExport = async (type: 'contacts' | 'data') => {
    setDownloadingFormat(type);
    try {
      const users = await getAllUsers();
      if (!users || users.length === 0) {
        alert('Aucun BZK à exporter.');
        setDownloadingFormat(null);
        return;
      }

      const timestamp = new Date().toISOString().slice(0, 10);

      if (type === 'contacts') {
        downloadAllBzkContacts(users);
        setExportLogs((prev) => [
          { date: new Date().toLocaleString('fr-FR'), label: 'EXPORT CONTACTS BZK', count: users.length },
          ...prev,
        ]);
      } else {
        const jsonContent = JSON.stringify(users, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `KAYDO_BZK_DONNEES_${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setExportLogs((prev) => [
          { date: new Date().toLocaleString('fr-FR'), label: 'EXPORT DONNÉES BZK', count: users.length },
          ...prev,
        ]);
      }
    } catch (e) {
      alert('Erreur lors de la génération de l\'exportation BZK.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="max-w-3xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2 uppercase">
          <Download className="w-6 h-6 text-rose-400" /> EXPORT BZK
        </h1>
        <p className="text-xs text-gray-400">
          Générez un fichier sécurisé contenant la liste complète des membres BZK autorisés.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        
        {/* EXPORT CONTACTS BZK */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-950/40 to-[#0e0a1f] border border-purple-500/30 space-y-4">
          <FileSpreadsheet className="w-10 h-10 text-emerald-400" />
          <div>
            <h3 className="font-extrabold text-white text-base">EXPORT CONTACTS BZK</h3>
            <p className="text-xs text-gray-400">Génère le fichier KAYDO_BZK_CONTACTS pour répertoire mobile.</p>
          </div>
          <button
            onClick={() => handleExport('contacts')}
            disabled={downloadingFormat === 'contacts'}
            className="w-full py-3 rounded-2xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg flex items-center justify-center gap-2"
          >
            {downloadingFormat === 'contacts' ? 'Génération...' : 'EXPORT CONTACTS BZK'}
          </button>
        </div>

        {/* EXPORT DONNÉES BZK */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-950/40 to-[#0e0a1f] border border-purple-500/30 space-y-4">
          <FileCode className="w-10 h-10 text-cyan-400" />
          <div>
            <h3 className="font-extrabold text-white text-base">EXPORT DONNÉES BZK</h3>
            <p className="text-xs text-gray-400">Format structuré de données brutes pour sauvegarde système.</p>
          </div>
          <button
            onClick={() => handleExport('data')}
            disabled={downloadingFormat === 'data'}
            className="w-full py-3 rounded-2xl text-xs font-extrabold text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-lg flex items-center justify-center gap-2"
          >
            {downloadingFormat === 'data' ? 'Génération...' : 'EXPORT DONNÉES BZK'}
          </button>
        </div>

      </div>

      {/* EXPORT HISTORY */}
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-rose-400" /> Historique des Exports Récents BZK
        </h3>

        {exportLogs.length === 0 ? (
          <div className="text-xs text-gray-400">Aucun export généré durant cette session.</div>
        ) : (
          <div className="space-y-2">
            {exportLogs.map((log, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/5 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-white">{log.label}</span> - {log.count} membre(s) BZK
                </div>
                <div className="text-[10px] text-gray-400 font-mono">{log.date}</div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
