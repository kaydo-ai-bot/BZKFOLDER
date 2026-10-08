import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { StatusItem, UserProfile } from '../types';

export async function createStatus(
  user: UserProfile,
  content: string,
  mediaUrl?: string,
  mediaType: 'text' | 'image' | 'video' = 'text'
): Promise<StatusItem> {
  const statusId = `status_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `statuses/${statusId}`;
  
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const status: StatusItem = {
    id: statusId,
    userId: user.id,
    userDisplayName: user.displayName,
    userBadge: user.badge,
    userPhoto: user.profilePhoto || '',
    content: content.trim(),
    mediaUrl: mediaUrl || '',
    mediaType,
    createdAt: now.toISOString(),
    expiresAt,
    visibility: 'public',
  };

  try {
    await setDoc(doc(db, 'statuses', statusId), status);
    return status;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getActiveStatuses(): Promise<StatusItem[]> {
  const nowIso = new Date().toISOString();

  try {
    const q = query(
      collection(db, 'statuses'),
      where('expiresAt', '>', nowIso),
      orderBy('expiresAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as StatusItem);
  } catch (error) {
    console.warn('getActiveStatuses error:', error);
    return [];
  }
}

export async function deleteStatus(statusId: string): Promise<void> {
  const path = `statuses/${statusId}`;
  try {
    await deleteDoc(doc(db, 'statuses', statusId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
