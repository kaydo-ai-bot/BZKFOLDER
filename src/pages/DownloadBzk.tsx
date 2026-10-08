import React, { useState } from 'react';
import { getAllUsers } from '../services/users';
import { downloadAllBzkContacts } from '../services/contactExporter';
import { useAuth } from '../context/AuthContext';
import { Download, CheckCircle2, ShieldCheck, Phone, Smartphone, FileCheck } from 'lucide-react';

interface DownloadBzkProps {
  onNavigate: (path: string) => void;
}

export const DownloadBzk: React.FC<DownloadBzkProps> = ({ onNavigate }) => {
  const { addToast } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [downloadedCount, setDownloadedCount] = useState<number | null>(null);

  const handleDownloadAll = async () => {
    setDownloading(true);
    setDownloadedCount(null);
    try {
      const contacts = await getAllUsers();
      if (!contacts || contacts.length === 0) {
        addToast('Aucun contact BZK disponible.', 'error');
        setDownloading(false);
        return;
      }

      // Trigger download with KAYDO_BZK_CONTACTS name
      downloadAllBzkContacts(contacts);
      setDownloadedCount(contacts.length);
      addToast(`${contacts.length} contact(s) BZK téléchargé(s) avec succès !`, 'success');
    } catch (e) {
      addToast('Échec de la génération du fichier BZK.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8 animate-fadeIn">
      
      <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-950/70 to-[#0e0a1f] border border-purple-500/30 backdrop-blur-2xl shadow-2xl space-y-6 text-center">
        
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-xl shadow-purple-600/30">
          <div className="w-full h-full bg-[#120a22] rounded-[14px] flex items-center justify-center">
            <Download className="w-8 h-8 text-cyan-400" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            TÉLÉCHARGER MES BZK
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto pt-1 leading-relaxed">
            Générez et téléchargez directement le fichier <span className="text-purple-300 font-mono font-bold">KAYDO_BZK_CONTACTS</span> pour enregistrer l'ensemble des membres BZK dans votre téléphone.
          </p>
          <div className="mt-3 p-3 rounded-xl bg-purple-900/30 border border-purple-500/30 text-[11px] text-purple-200">
            💡 <strong>Sauvegarde Permanente :</strong> Même après le téléchargement, tous les numéros restent en toute sécurité sur le site (base de données) pour les versions futures et le répertoire communautaire.
          </div>
        </div>

        {/* BUTTON */}
        <div className="pt-2 flex flex-col items-center justify-center gap-3">
          <button
            onClick={handleDownloadAll}
            disabled={downloading}
            className="w-full sm:w-auto px-10 py-4 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-xl shadow-purple-600/30 border border-purple-400/30 transition transform active:scale-95 flex items-center justify-center gap-3"
          >
            {downloading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Préparation du fichier KAYDO_BZK_CONTACTS...
              </span>
            ) : (
              <>
                <Download className="w-5 h-5" />
                ENREGISTRER LE CONTACT BZK
              </>
            )}
          </button>
        </div>

        {/* CONFIRMATION CARD IF DOWNLOADED */}
        {downloadedCount !== null && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-3 text-left animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold">Téléchargement BZK Réussi !</div>
              <div className="text-[11px] text-emerald-300/80">
                {downloadedCount} contact(s) inclus dans le fichier <span className="font-mono font-bold">KAYDO_BZK_CONTACTS</span>. Ouvrez le fichier téléchargé sur votre téléphone pour importer les contacts BZK.
              </div>
            </div>
          </div>
        )}

        {/* INSTRUCTIONS */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-300 text-left space-y-2">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            Comment importer sur votre téléphone :
          </div>
          <ol className="list-decimal list-inside space-y-1 text-gray-400 text-[11px]">
            <li>Cliquez sur le bouton ci-dessus pour lancer la génération BZK.</li>
            <li>Ouvrez le fichier téléchargé <span className="text-purple-300 font-mono">KAYDO_BZK_CONTACTS</span> depuis vos téléchargements.</li>
            <li>Sélectionnez "Ajouter les contacts" ou "Importer" dans l'application Contacts de votre smartphone.</li>
          </ol>
        </div>

      </div>

    </div>
  );
};
