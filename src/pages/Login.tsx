import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Phone, LogIn, FolderKey, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onNavigate: (path: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { loginAccount, addToast } = useAuth();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      addToast('Veuillez entrer votre numéro de téléphone.', 'error');
      return;
    }

    setLoading(true);
    try {
      await loginAccount(phone.trim());
      addToast('Connexion réussie !', 'success');
      onNavigate('/');
    } catch (err: any) {
      addToast(err.message || 'Échec de connexion.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fadeIn">
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-purple-950/60 to-[#0d091a] border border-purple-500/30 backdrop-blur-2xl shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-0.5 shadow-lg shadow-purple-600/30">
            <div className="w-full h-full bg-[#0e0a1f] rounded-[14px] flex items-center justify-center">
              <FolderKey className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white">Connexion BZK FOLDER</h2>
          <p className="text-xs text-gray-400">
            Saisissez votre numéro (+509..., 509... ou 8 chiffres) pour vous connecter.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
              Numéro de Téléphone
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+509 34 12 3456"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-purple-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition text-sm font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-xl shadow-purple-600/30 border border-purple-400/30 transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Se Connecter
              </>
            )}
          </button>

        </form>

        <div className="text-center text-xs text-gray-400 border-t border-white/10 pt-4 space-y-2">
          <div>
            Pas encore inscrit ?{' '}
            <button
              onClick={() => onNavigate('/register')}
              className="text-purple-300 font-bold hover:underline"
            >
              Rejoindre BZK FOLDER
            </button>
          </div>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('/admin/login')}
              className="text-gray-500 hover:text-cyan-400 text-[11px] transition flex items-center justify-center gap-1 mx-auto"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              ESPACE PROPRIÉTAIRE
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
