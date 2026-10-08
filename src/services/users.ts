import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { UserProfile, Gender } from '../types';

export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.replace(/\D/g, '');
  } else {
    cleaned = '+' + cleaned.slice(1).replace(/\D/g, '');
  }
  return cleaned;
}

/**
 * Generates official BZK badge and display name strictly adhering to:
 * Filles  : 🌸 NOM BZK 🌪️
 * Garçons : 🥷 NOM BZK 🌪️
 */
export function generateBadgeAndDisplayName(firstName: string, gender: Gender) {
  // Strip any accidental enclosing quotes
  let cleanName = (firstName || 'MEMBRE').trim().replace(/^["'«»“”„]+|["'«»“”„]+$/g, '').trim();
  // Remove any existing emojis or artifacts at the start (including duplicates)
  cleanName = cleanName.replace(/^[🌸🥷🌪️\sBZK]+/g, '').trim();
  if (!cleanName) cleanName = 'MEMBRE';

  // Capitalize
  const upperName = cleanName.toUpperCase();
  const BZK_STYLED = '𝑩𝒁𝑲';

  if (gender === 'female') {
    const badge = `🌸 ${upperName} ${BZK_STYLED} 🌪️`;
    const displayName = `🌸 ${upperName} ${BZK_STYLED} 🌪️`;
    return {
      firstName: cleanName,
      badge,
      displayName,
    };
  } else {
    const badge = `🥷 ${upperName} ${BZK_STYLED} 🌪️`;
    const displayName = `🥷 ${upperName} ${BZK_STYLED} 🌪️`;
    return {
      firstName: cleanName,
      badge,
      displayName,
    };
  }
}

/**
 * Met à jour, normalise et supprime les doublons de tous les contacts enregistrés
 */
let hasMigrated_v4 = false;
export async function syncExistingContactsFormat(): Promise<void> {
  if (hasMigrated_v4) return;
  hasMigrated_v4 = true;
  try {
    const snap = await getDocs(collection(db, 'users'));
    if (snap.empty) return;

    const batch = writeBatch(db);
    let needUpdate = false;
    const seenPhones = new Set<string>();
    const toDelete: any[] = [];

    snap.docs.forEach((d) => {
      const u = d.data() as UserProfile;
      const phoneNorm = u.phoneNormalized || normalizePhoneNumber(u.phone);

      // Deduplication: if phone already seen, delete duplicate
      if (phoneNorm && seenPhones.has(phoneNorm)) {
        toDelete.push(d.ref);
        return;
      }
      if (phoneNorm) {
        seenPhones.add(phoneNorm);
      }

      // Clean first name from any quotes AND emojis/artifacts
      let cleanFirstName = (u.firstName || '').replace(/^["'«»“”„]+|["'«»“”„]+$/g, '').trim();
      cleanFirstName = cleanFirstName.replace(/^[🌸🥷🌪️\sBZK]+/g, '').trim();
      if (!cleanFirstName) cleanFirstName = 'MEMBRE';

      const computed = generateBadgeAndDisplayName(cleanFirstName, u.gender);

      if (u.displayName !== computed.displayName || u.badge !== computed.badge || !u.phoneNormalized || u.firstName !== cleanFirstName) {
        batch.update(d.ref, {
          firstName: cleanFirstName,
          displayName: computed.displayName,
          badge: computed.badge,
          phoneNormalized: phoneNorm,
          updatedAt: new Date().toISOString(),
        });
        needUpdate = true;
      }
    });

    toDelete.forEach((ref) => {
      batch.delete(ref);
      needUpdate = true;
    });

    if (needUpdate) {
      await batch.commit();
    }
  } catch (err) {
    console.warn('Contacts format sync & deduplication:', err);
  }
}

// Run sync silently on module load
syncExistingContactsFormat().catch(() => {});

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    console.warn('getUserProfile error:', error);
    return null;
  }
}

export async function checkPhoneExists(phoneNormalized: string): Promise<UserProfile | null> {
  const path = 'users';
  try {
    const q = query(collection(db, 'users'), where('phoneNormalized', '==', phoneNormalized), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as UserProfile;
  } catch (error) {
    console.warn('checkPhoneExists warning:', error);
    return null;
  }
}

export async function createUserProfile(profileData: Omit<UserProfile, 'createdAt' | 'updatedAt' | 'isActive' | 'displayName' | 'badge'> & { id: string }): Promise<UserProfile> {
  const path = `users/${profileData.id}`;
  const now = new Date().toISOString();
  
  const { firstName, badge, displayName } = generateBadgeAndDisplayName(profileData.firstName, profileData.gender);

  const fullProfile: UserProfile = {
    ...profileData,
    firstName,
    displayName,
    badge,
    createdAt: now,
    updatedAt: now,
    isActive: true,
    statusSharingAllowed: profileData.statusSharingAllowed ?? true,
  };

  try {
    await setDoc(doc(db, 'users', profileData.id), fullProfile);
    return fullProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  const path = `users/${userId}`;
  const now = new Date().toISOString();

  let patch: Partial<UserProfile> = {
    ...updates,
    updatedAt: now,
  };

  if (updates.firstName !== undefined || updates.gender !== undefined) {
    const current = await getUserProfile(userId);
    if (current) {
      const newGender = updates.gender || current.gender;
      const newFirstName = updates.firstName !== undefined ? updates.firstName : current.firstName;
      const computed = generateBadgeAndDisplayName(newFirstName, newGender);
      patch.firstName = computed.firstName;
      patch.badge = computed.badge;
      patch.displayName = computed.displayName;
      patch.gender = newGender;
    }
  }

  try {
    await updateDoc(doc(db, 'users', userId), patch);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteUserProfile(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Supprime tous les contacts enregistrés en une seule fois (Réservé au Propriétaire)
 */
export async function clearAllUsers(): Promise<number> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, 'users'));
    if (snap.empty) return 0;
    
    const batch = writeBatch(db);
    let count = 0;
    snap.docs.forEach((d) => {
      batch.delete(d.ref);
      count++;
    });
    await batch.commit();
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return 0;
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    await syncExistingContactsFormat();
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (snap.empty) {
      return [];
    }
    return snap.docs.map((d) => d.data() as UserProfile);
  } catch (error) {
    console.warn('getAllUsers error:', error);
    return [];
  }
}

export function subscribeToUsers(callback: (users: UserProfile[]) => void): () => void {
  syncExistingContactsFormat().catch(() => {});
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const usersList = snapshot.docs.map((d) => d.data() as UserProfile);
      callback(usersList);
    },
    (error) => {
      console.warn('Firestore users subscription status:', error.message);
    }
  );
}

// Aliases for Admin components
export const getAdminContacts = getAllUsers;
export const deleteAdminContact = deleteUserProfile;
export const clearAllAdminContacts = clearAllUsers;
export const updateAdminContact = updateUserProfile;
