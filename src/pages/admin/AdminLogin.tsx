import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, ArrowRight, Lock, ArrowLeft, Key, CheckCircle, ShieldAlert } from 'lucide-react';

interface AdminLoginProps {
  onNavigate: (path: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onNavigate }) => {
  const { loginAsAdmin, setNewAdminCode } = useAuth();
  
  const [codeSetOnce, setCodeSetOnce] = useState<boolean>(false);
  const [tab, setTab] = useState<'login' | 'set_code'>('login');
  const [accessKey, setAccessKey] = useState('');
  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/status')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.codeSetOnce === 'boolean') {
          setCodeSetOnce(data.codeSetOnce);
          // If code was already set once, force login tab
          if (data.codeSetOnce) {
            setTab('login');
          }
        }
      })
      .catch((e) => console.warn(e));
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!accessKey.trim()) return;

    setLoading(true);
    const success = await loginAsAdmin(accessKey.trim());
    setLoading(false);

    if (success) {
      onNavigate('/admin');
    } else {
      setErrorMessage('Code propriétaire incorrect.');
    }
  };

  const handleSetCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (codeSetOnce) {
      setErrorMessage('Le mot de passe propriétaire a déjà été défini une fois et est enregistré à jamais. Il ne peut plus être modifié.');
      return;
    }

    if (newCode.trim().length < 3) {
      setErrorMessage('Le code doit contenir au moins 3 caractères.');
      return;
    }

    if (newCode.trim() !== confirmCode.trim()) {
      setErrorMessage('Les deux codes ne correspondent pas.');
      return;
    }

    setLoading(true);
    const success = await setNewAdminCode(newCode.trim());
    setLoading(false);

    if (success) {
      onNavigate('/admin');
    } else {
      setErrorMessage('Impossible de modifier le code (déjà enregistré à jamais).');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fadeIn">
      <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-950/70 via-[#12081c] to-[#0d0515] border border-purple-500/40 backdrop-blur-2xl shadow-2xl space-y-6">
        
        {/* HEADER */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-xl shadow-purple-900/40">
            <div className="w-full h-full bg-[#150a22] rounded-[14px] flex items-center justify-center">
              <Lock className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider uppercase">ESPACE PROPRIÉTAIRE</h1>
          <div className="inline-block px-3.5 py-1 rounded-full text-xs font-mono font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            BZK FOLDER 🥷 BY KAYDO BZK 🥷
          </div>
        </div>

        {/* TABS (Only show set_code if codeSetOnce is false) */}
        {!codeSetOnce && (
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setTab('login'); setErrorMessage(''); }}
              className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                tab === 'login'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Connexion
            </button>

            <button
              type="button"
              onClick={() => { setTab('set_code'); setErrorMessage(''); }}
              className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                tab === 'set_code'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              Définir code (1 seule fois)
            </button>
          </div>
        )}

        {codeSetOnce && (
          <div className="p-3 rounded-xl bg-purple-900/30 border border-purple-500/30 text-xs text-purple-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Le mot de passe propriétaire a été configuré et est enregistré à jamais. Modification impossible.</span>
          </div>
        )}

        {/* ERROR MESSAGE IF ANY */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs leading-relaxed animate-fadeIn text-center">
            {errorMessage}
          </div>
        )}

        {/* TAB 1: LOGIN FORM */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Code Propriétaire Permanent
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-purple-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Entrez votre code secret"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition text-sm font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-xl shadow-purple-900/40 border border-purple-400/30 transition transform active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  DÉVERROUILLER L'ESPACE PROPRIÉTAIRE
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: SET CODE FORM (Only if codeSetOnce is false) */}
        {!codeSetOnce && tab === 'set_code' && (
          <form onSubmit={handleSetCodeSubmit} className="space-y-4 pt-1">
            <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200 leading-relaxed">
              Vous pouvez définir votre code propriétaire unique <strong>une seule fois</strong>. Une fois enregistré, il sera sauvegardé à jamais et ne pourra plus jamais être modifié ou réinitialisé.
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Nouveau Code Propriétaire Unique
              </label>
              <div className="relative">
                <Key className="w-5 h-5 text-purple-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Entrez votre code définitif"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                Confirmer le Code Définitif
              </label>
              <div className="relative">
                <CheckCircle className="w-5 h-5 text-emerald-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  placeholder="Confirmez le code définitif"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-purple-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition text-sm font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-xl shadow-emerald-900/40 border border-emerald-400/30 transition transform active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  ENREGISTRER À JAMAIS & ACCÉDER
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-2 text-center">
          <button
            onClick={() => onNavigate('/')}
            className="text-xs text-gray-400 hover:text-white inline-flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Retour à l'accueil
          </button>
        </div>

      </div>
    </div>
  );
};
