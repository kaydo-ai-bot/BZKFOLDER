import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { downloadSingleBzkContact } from '../services/contactExporter';
import { Share2, QrCode, Copy, UserPlus, Check, Sparkles, ShieldCheck } from 'lucide-react';

interface ShareBzkProps {
  onNavigate: (path: string) => void;
}

export const ShareBzk: React.FC<ShareBzkProps> = ({ onNavigate }) => {
  const { profile, addToast } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Connexion requise</h2>
        <button onClick={() => onNavigate('/login')} className="px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl text-xs">
          Se connecter
        </button>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/bzk/${profile.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    addToast('Lien BZK copié dans le presse-papier !', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `KAYDO FOLDER - ${profile.displayName}`,
        text: `Découvrez mon profil BZK sur KAYDO FOLDER : ${profile.displayName}`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  const handleAddBzk = () => {
    downloadSingleBzkContact(profile);
    addToast('Fiche CONTACT BZK téléchargée !', 'success');
  };

  // SVG QR Code Generator Helper
  const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}&color=a855f7&bgcolor=0e0a1f`;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-950/70 to-[#0e0a1f] border border-purple-500/30 backdrop-blur-2xl shadow-2xl space-y-6 text-center">
        
        <div className="space-y-1">
          <div className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
            KAYDO FOLDER SYSTEM
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            PARTAGER MON BZK
          </h1>
        </div>

        {/* PROFILE BADGE PREVIEW */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center font-bold text-white">
            {profile.firstName.charAt(0)}
          </div>
          <div className="text-left">
            <div className="font-extrabold text-white text-base">{profile.displayName}</div>
            <div className="text-xs text-purple-400 font-mono font-bold">{profile.badge}</div>
          </div>
        </div>

        {/* MON QR BZK SECTION */}
        <div className="p-6 rounded-3xl bg-[#090615] border border-purple-500/20 space-y-3 inline-block">
          <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-center gap-1.5">
            <QrCode className="w-4 h-4" />
            MON QR BZK
          </div>

          <div className="p-3 bg-[#0e0a1f] rounded-2xl border border-purple-500/30 inline-block shadow-xl">
            <img
              src={qrCodeDataUrl}
              alt="MON QR BZK"
              className="w-44 h-44 rounded-xl object-contain"
            />
          </div>

          <p className="text-[10px] text-gray-400">
            Faites scanner ce QR BZK pour partager instantanément votre profil.
          </p>
        </div>

        {/* SHARE LINK BOX */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 text-xs font-mono text-gray-300">
          <span className="truncate">{shareUrl}</span>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shrink-0 flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-cyan-300" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copié' : 'COPIER'}
          </button>
        </div>

        {/* THREE MANDATORY BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          
          <button
            onClick={handleAddBzk}
            className="py-3 px-3 rounded-2xl text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-500 transition shadow-lg flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            AJOUTER BZK
          </button>

          <button
            onClick={handleNativeShare}
            className="py-3 px-3 rounded-2xl text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition shadow-lg flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-4 h-4" />
            PARTAGER
          </button>

          <button
            onClick={handleCopy}
            className="py-3 px-3 rounded-2xl text-xs font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-center gap-1.5"
          >
            <Copy className="w-4 h-4 text-cyan-400" />
            COPIER
          </button>

        </div>

      </div>

    </div>
  );
};
