import React, { useState } from 'react';
import { FileText, Shield, Key, Download, Trash2, Edit3, UserCheck } from 'lucide-react';

interface MockLog {
  id: string;
  timestamp: string;
  action: string;
  result: string;
  details: string;
}

export const AdminLogs: React.FC = () => {
  // In a full system, logs are fetched from adminLogs collection in Firestore or backend
  const [logs] = useState<MockLog[]>([
    {
      id: 'log_1',
      timestamp: new Date().toLocaleString('fr-FR'),
      action: 'LOGIN_SUCCESS',
      result: 'SUCCESS',
      details: 'Authentification administrateur réussie via session HTTP-Only',
    },
    {
      id: 'log_2',
      timestamp: new Date(Date.now() - 3600000).toLocaleString('fr-FR'),
      action: 'EXPORT_CONTACTS',
      result: 'SUCCESS',
      details: 'Génération du fichier de sauvegarde des contacts au format CSV',
    },
  ]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-rose-400" /> Journal de Sécurité & Audit (adminLogs)
        </h1>
        <p className="text-xs text-gray-400">
          Traçabilité complète des accès et opérations sensibles effectuées par l'administrateur.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-rose-500/20 bg-[#0e071a]">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-[#150926] text-gray-400 font-mono uppercase text-[10px] tracking-wider border-b border-white/10">
            <tr>
              <th className="p-4">Horodatage</th>
              <th className="p-4">Action</th>
              <th className="p-4">Résultat</th>
              <th className="p-4">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-white/5 transition">
                <td className="p-4 font-mono text-gray-400">{log.timestamp}</td>
                <td className="p-4 font-bold text-rose-300">{log.action}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {log.result}
                  </span>
                </td>
                <td className="p-4 text-gray-300">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
