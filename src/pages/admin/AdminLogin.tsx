import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { ShieldCheck, ArrowRight, Lock, ArrowLeft, ShieldAlert } from 'lucide-react';

interface AdminLoginProps {
  onNavigate: (path: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onNavigate }) => {
  const { loginAsGoogleAdmin, addToast } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const email = user.email ? user.email.trim().toLowerCase() : '';

      if (email !== 'kberryprime@gmail.com') {
        // Sign out immediately if not the authorized owner
        await signOut(auth);
        setErrorMessage(`Accès refusé (${email}). Seul le compte Google kberryprime@gmail.com est autorisé à accéder à l'espace propriétaire. Tous les autres comptes sont refusés.`);
        addToast('Compte Google non autorisé.', 'error');
        setLoading(false);
        return;
      }

      // Authorized! Proceed to backend admin session creation
      const success = await loginAsGoogleAdmin(email);
      setLoading(false);

      if (success) {
        onNavigate('/admin');
      } else {
        setErrorMessage('Échec de la validation de la session propriétaire.');
      }
    } catch (err: any) {
      console.error('Google auth error:', err);
      setLoading(false);
      setErrorMessage(err.message || 'Erreur lors de la connexion avec Google.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fadeIn">
      <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-950/70 via-[#12081c] to-[#0d0515] border border-purple-500/40 backdrop-blur-2xl shadow-2xl space-y-6">
        
        {/* HEADER */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-xl shadow-purple-900/40">
            <div className="w-full h-full bg-[#150a22] rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider uppercase">ESPACE PROPRIÉTAIRE</h1>
          <div className="inline-block px-3.5 py-1 rounded-full text-xs font-mono font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            BZK FOLDER 🥷 BY KAYDO BZK 🥷
          </div>
        </div>

        {/* NOTICE */}
        <div className="p-4 rounded-2xl bg-purple-950/50 border border-purple-500/30 text-xs text-purple-200 leading-relaxed space-y-2">
          <div className="flex items-center gap-2 font-bold text-white">
            <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Authentification Google Requise</span>
          </div>
          <p>
            L'accès à l'espace propriétaire est strictement réservé au compte Google <strong className="text-cyan-300 font-mono">kberryprime@gmail.com</strong>. Tous les autres comptes sont automatiquement refusés.
          </p>
        </div>

        {/* ERROR MESSAGE IF ANY */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs leading-relaxed animate-fadeIn text-center">
            {errorMessage}
          </div>
        )}

        {/* GOOGLE LOGIN BUTTON */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-4 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-xl shadow-purple-900/40 border border-purple-400/30 transition transform active:scale-95 flex items-center justify-center gap-3"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              SE CONNECTER AVEC GOOGLE
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

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
