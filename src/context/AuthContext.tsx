import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Gender } from '../types';
import {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  deleteUserProfile,
  normalizePhoneNumber,
  checkPhoneExists,
} from '../services/users';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AuthContextType {
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  registerUserAccount: (params: {
    firstName: string;
    phone: string;
    country: string;
    gender: Gender;
    consent: boolean;
  }) => Promise<UserProfile>;
  loginAccount: (phone: string) => Promise<UserProfile>;
  logoutUser: () => Promise<void>;
  loginAsGoogleAdmin: (email: string) => Promise<boolean>;
  setNewAdminCode: (newCode: string) => Promise<boolean>;
  logoutAdminSession: () => Promise<void>;
  reloadProfile: () => Promise<void>;
  checkAdminSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const checkAdminSession = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/session');
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(!!data.authenticated);
        return !!data.authenticated;
      }
      setIsAdmin(false);
      return false;
    } catch (e) {
      setIsAdmin(false);
      return false;
    }
  };

  const reloadProfile = async () => {
    const savedId = localStorage.getItem('kaydo_bzk_user_id');
    if (savedId) {
      const p = await getUserProfile(savedId);
      if (p) setProfile(p);
    }
  };

  useEffect(() => {
    checkAdminSession();
    const initProfile = async () => {
      const savedId = localStorage.getItem('kaydo_bzk_user_id');
      if (savedId) {
        try {
          const p = await getUserProfile(savedId);
          setProfile(p);
        } catch (e) {
          console.warn(e);
        }
      }
      setLoading(false);
    };
    initProfile();
  }, []);

  const registerUserAccount = async ({
    firstName,
    phone,
    country,
    gender,
    consent,
  }: {
    firstName: string;
    phone: string;
    country: string;
    gender: Gender;
    consent: boolean;
  }): Promise<UserProfile> => {
    if (!consent) {
      throw new Error('Veuillez accepter les conditions de traitement de votre numéro.');
    }

    const normalized = normalizePhoneNumber(phone);
    if (!normalized || normalized.length < 6) {
      throw new Error('Numéro de téléphone invalide.');
    }

    // Duplicate Check in Firestore: If phone already exists, delete old profile and replace with new submission (new name/badge)
    const existing = await checkPhoneExists(normalized);
    if (existing) {
      try {
        await deleteUserProfile(existing.id);
      } catch (e) {
        console.warn('Could not delete old profile for replacement:', e);
      }
    }

    // Generate unique BZK ID for Firestore
    const newUid = `bzk_uid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const created = await createUserProfile({
      id: newUid,
      phone,
      phoneNormalized: normalized,
      firstName,
      gender,
      country,
      consent,
      email: `bzk_${normalized.replace(/\+/g, '')}@kaydofolder.app`,
      statusSharingAllowed: true,
    });

    localStorage.setItem('kaydo_bzk_user_id', newUid);
    setProfile(created);
    addToast(existing ? 'Ancien profil remplacé par la nouvelle inscription BZK !' : 'Inscription BZK réussie !', 'success');
    return created;
  };

  const loginAccount = async (phone: string): Promise<UserProfile> => {
    const norm = normalizePhoneNumber(phone);
    const matched = await checkPhoneExists(norm);
    if (!matched) {
      throw new Error('Aucun compte BZK trouvé pour ce numéro.');
    }

    localStorage.setItem('kaydo_bzk_user_id', matched.id);
    setProfile(matched);
    addToast(`Ravi de vous revoir, ${matched.displayName} !`, 'success');
    return matched;
  };

  const logoutUser = async () => {
    localStorage.removeItem('kaydo_bzk_user_id');
    setProfile(null);
    addToast('Vous êtes déconnecté.', 'info');
  };

  const loginAsGoogleAdmin = async (email: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast(data.message || 'Accès refusé.', 'error');
        return false;
      }

      setIsAdmin(true);
      addToast('Accès propriétaire Google autorisé (kberryprime@gmail.com) !', 'success');
      return true;
    } catch (err: any) {
      addToast('Erreur lors de la connexion Google.', 'error');
      return false;
    }
  };

  const setNewAdminCode = async (newCode: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/set-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newCode: newCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        addToast(data.message || 'Échec de la mise à jour du code.', 'error');
        return false;
      }

      setIsAdmin(true);
      addToast('Nouveau code propriétaire enregistré avec succès !', 'success');
      return true;
    } catch (err: any) {
      addToast('Erreur lors de l\'enregistrement du code.', 'error');
      return false;
    }
  };

  const logoutAdminSession = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsAdmin(false);
      addToast('Session propriétaire fermée.', 'info');
    } catch (err) {
      setIsAdmin(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        profile,
        isAdmin,
        loading,
        toasts,
        addToast,
        removeToast,
        registerUserAccount,
        loginAccount,
        logoutUser,
        loginAsGoogleAdmin,
        setNewAdminCode,
        logoutAdminSession,
        reloadProfile,
        checkAdminSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
