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

export function normalizePhoneNumber(phone: string, country?: string): string {
  if (!phone) return '';
  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // Remove leading double zero '00'
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  // Handle Haiti (+509):
  // National numbers have 8 digits (e.g. 35975863 or 41815156)
  // If digits has exactly 8 digits, prepend 509 -> "50935975863"
  // If digits starts with 509 and has 11 digits (e.g. "50935975863"), keep as is
  if (digits.length === 8) {
    digits = '509' + digits;
  } else if (digits.startsWith('509') && digits.length === 11) {
    // Already in complete Haiti format (+509xxxxxxxx)
  } else if (country) {
    const match = country.match(/\(\+(\d+)\)/);
    if (match && match[1]) {
      const dialCode = match[1];
      if (!digits.startsWith(dialCode)) {
        digits = dialCode + digits;
      }
    }
  }

  return '+' + digits;
}

/**
 * Strips all emojis and residual artifacts from a name to guarantee
 * a clean string before applying the single BZK prefix emoji.
 */
export function cleanRawFirstName(rawName: string): string {
  if (!rawName) return 'MEMBRE';
  let clean = rawName.trim().replace(/^["'«»“”„]+|["'«»“”„]+$/g, '').trim();

  // Strip any emoji characters (all Unicode emoji ranges)
  try {
    clean = clean.replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Emoji}]/gu, '').trim();
  } catch {
    clean = clean.replace(/[🌸🥷🌪️✨🔥👑⭐💫💎🕊️]/g, '').trim();
  }

  // Strip prefix/suffix artifacts like BZK, 𝑩𝒁𝑲
  clean = clean.replace(/\b(?:BZK|𝑩𝒁𝑲)\b/gi, '').trim();
  clean = clean.replace(/^(?:BZK|𝑩𝒁𝑲)\s*/gi, '').trim();
  clean = clean.replace(/\s*(?:BZK|𝑩𝒁𝑲)$/gi, '').trim();

  return clean.trim() || 'MEMBRE';
}

/**
 * Generates official BZK badge and display name strictly adhering to:
 * Exactly ONE prefix emoji:
 * Filles  : 🌸 NOM 𝑩𝒁𝑲 🌪️
 * Garçons : 🥷 NOM 𝑩𝒁𝑲 🌪️
 */
export function generateBadgeAndDisplayName(firstName: string, gender: Gender) {
  const cleanName = cleanRawFirstName(firstName);
  const upperName = cleanName.toUpperCase();
  const BZK_STYLED = '𝑩𝒁𝑲';

  if (gender === 'female') {
    const badge = `🌸 ${BZK_STYLED} 🌪️`;
    const displayName = `🌸 ${upperName} ${BZK_STYLED} 🌪️`;
    return {
      firstName: cleanName,
      badge,
      displayName,
    };
  } else {
    const badge = `🥷 ${BZK_STYLED} 🌪️`;
    const displayName = `🥷 ${upperName} ${BZK_STYLED} 🌪️`;
    return {
      firstName: cleanName,
      badge,
      displayName,
    };
  }
}

/**
 * Met à jour et normalise l'affichage de tous les contacts enregistrés SANS JAMAIS EN SUPPRIMER AUCUN.
 * Tous les numéros restent en permanence conservés sur le site.
 */
let hasMigrated_v6 = false;
export async function syncExistingContactsFormat(): Promise<void> {
  if (hasMigrated_v6) return;
  hasMigrated_v6 = true;
  try {
    const snap = await getDocs(collection(db, 'users'));
    if (snap.empty) return;

    const batch = writeBatch(db);
    let needUpdate = false;

    snap.docs.forEach((d) => {
      const u = d.data() as UserProfile;
      const phoneNorm = normalizePhoneNumber(u.phoneNormalized || u.phone, u.country);

      // Clean first name from any quotes, emojis, and artifacts
      const cleanFirstName = cleanRawFirstName(u.firstName || u.displayName);
      const computed = generateBadgeAndDisplayName(cleanFirstName, u.gender);

      if (
        u.displayName !== computed.displayName ||
        u.badge !== computed.badge ||
        u.phoneNormalized !== phoneNorm ||
        u.firstName !== cleanFirstName
      ) {
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

    if (needUpdate) {
      await batch.commit();
    }
  } catch (err) {
    console.warn('Contacts format sync:', err);
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

export async function checkPhoneExists(phoneInput: string, country?: string): Promise<UserProfile | null> {
  const norm = normalizePhoneNumber(phoneInput, country);
  if (!norm && !phoneInput) return null;

  try {
    // 1. Direct query with normalized phone (+50935975863)
    if (norm) {
      const q1 = query(collection(db, 'users'), where('phoneNormalized', '==', norm), limit(1));
      const snap1 = await getDocs(q1);
      if (!snap1.empty) return snap1.docs[0].data() as UserProfile;
    }

    // 2. Query with raw trimmed input
    const trimmedInput = phoneInput.trim();
    if (trimmedInput) {
      const q2 = query(collection(db, 'users'), where('phone', '==', trimmedInput), limit(1));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) return snap2.docs[0].data() as UserProfile;
    }

    // 3. Query without the '+' sign (e.g. "50935975863")
    const withoutPlus = norm ? norm.replace(/^\+/, '') : '';
    if (withoutPlus) {
      const q3 = query(collection(db, 'users'), where('phoneNormalized', '==', withoutPlus), limit(1));
      const snap3 = await getDocs(q3);
      if (!snap3.empty) return snap3.docs[0].data() as UserProfile;
    }

    // 4. Query with the 8 national digits if Haiti number
    if (withoutPlus.startsWith('509') && withoutPlus.length === 11) {
      const national8 = withoutPlus.slice(3);
      const q4 = query(collection(db, 'users'), where('phoneNormalized', '==', `+${national8}`), limit(1));
      const snap4 = await getDocs(q4);
      if (!snap4.empty) return snap4.docs[0].data() as UserProfile;

      const q5 = query(collection(db, 'users'), where('phone', '==', national8), limit(1));
      const snap5 = await getDocs(q5);
      if (!snap5.empty) return snap5.docs[0].data() as UserProfile;
    }

    // 5. In-memory fallback scan across all users to guarantee that variations like 35975863, 50935975863, and +50935975863 always match
    const cleanDigits = phoneInput.replace(/\D/g, '');
    if (cleanDigits.length >= 6) {
      const allUsers = await getAllUsers();
      const match = allUsers.find((u) => {
        const uNorm = u.phoneNormalized || normalizePhoneNumber(u.phone, u.country);
        if (norm && uNorm === norm) return true;
        const uDigits = (u.phoneNormalized || u.phone || '').replace(/\D/g, '');
        if (uDigits === cleanDigits) return true;
        // Haiti 8 digits vs 11 digits (509 + 8 digits)
        if (cleanDigits.length === 8 && uDigits === `509${cleanDigits}`) return true;
        if (uDigits.length === 8 && cleanDigits === `509${uDigits}`) return true;
        if (uDigits.endsWith(cleanDigits) && cleanDigits.length >= 8) return true;
        if (cleanDigits.endsWith(uDigits) && uDigits.length >= 8) return true;
        return false;
      });
      if (match) return match;
    }

    return null;
  } catch (error) {
    console.warn('checkPhoneExists warning:', error);
    try {
      const cleanDigits = phoneInput.replace(/\D/g, '');
      const allUsers = await getAllUsers();
      const match = allUsers.find((u) => {
        const uDigits = (u.phoneNormalized || u.phone || '').replace(/\D/g, '');
        if (uDigits === cleanDigits) return true;
        if (cleanDigits.length === 8 && uDigits === `509${cleanDigits}`) return true;
        if (uDigits.length === 8 && cleanDigits === `509${uDigits}`) return true;
        return false;
      });
      return match || null;
    } catch {
      return null;
    }
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
  try {
    await syncExistingContactsFormat();
    const snap = await getDocs(collection(db, 'users'));
    if (snap.empty) {
      return [];
    }
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserProfile));
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  } catch (error) {
    console.warn('getAllUsers error:', error);
    return [];
  }
}

export function subscribeToUsers(callback: (users: UserProfile[]) => void): () => void {
  syncExistingContactsFormat().catch(() => {});
  return onSnapshot(
    collection(db, 'users'),
    (snapshot) => {
      const usersList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as UserProfile));
      usersList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
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
