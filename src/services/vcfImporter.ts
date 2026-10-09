import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { UserProfile } from '../types';
import { PreparedVcfContact } from './vcfParser';

export interface ImportProgress {
  processed: number;
  total: number;
  percent: number;
  currentBatch: number;
  totalBatches: number;
  statusText: string;
}

export interface ImportSummary {
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: string[];
}

/**
 * Imports valid contacts from VCF in batches into Firestore.
 * Conforms to Firestore batch limits (<= 500 operations, using 200 per batch for stability).
 */
export async function importVcfContactsBatch(
  contacts: PreparedVcfContact[],
  options: {
    updateExisting?: boolean;
    onProgress?: (progress: ImportProgress) => void;
  } = {}
): Promise<ImportSummary> {
  const { updateExisting = false, onProgress } = options;

  // Filter contacts to process
  const candidates = contacts.filter((c) => {
    if (c.status === 'ready') return true;
    if (updateExisting && c.status === 'already_in_db' && c.existingId) return true;
    return false;
  });

  const total = candidates.length;
  if (total === 0) {
    return {
      importedCount: 0,
      updatedCount: 0,
      skippedCount: contacts.filter((c) => c.status !== 'ready').length,
      errorCount: 0,
      errors: [],
    };
  }

  const BATCH_SIZE = 200;
  const totalBatches = Math.ceil(total / BATCH_SIZE);
  let importedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, total);
    const chunk = candidates.slice(start, end);

    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (const c of chunk) {
      const isUpdate = c.status === 'already_in_db' && c.existingId;
      const targetDocId = isUpdate && c.existingId ? c.existingId : `bzk_uid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const userProfile: UserProfile = {
        id: targetDocId,
        phone: c.phoneNormalized,
        phoneNormalized: c.phoneNormalized,
        firstName: c.cleanFirstName,
        displayName: c.displayName,
        badge: c.badge,
        gender: c.gender,
        country: c.country,
        consent: true,
        statusSharingAllowed: true,
        isActive: true,
        status: 'Actif',
        email: `bzk_${c.phoneNormalized.replace(/\+/g, '')}@kaydofolder.app`,
        createdAt: isUpdate && c.existingCreatedAt ? c.existingCreatedAt : now,
        updatedAt: now,
      };

      const docRef = doc(db, 'users', targetDocId);
      batch.set(docRef, userProfile, { merge: true });
    }

    try {
      await batch.commit();

      for (const c of chunk) {
        if (c.status === 'already_in_db') {
          updatedCount++;
        } else {
          importedCount++;
        }
      }
    } catch (err: any) {
      console.error(`Batch ${batchIndex + 1}/${totalBatches} error:`, err);
      errorCount += chunk.length;
      errors.push(`Erreur sur le lot ${batchIndex + 1}: ${err.message || 'Échec de l\'écriture Firestore'}`);
      handleFirestoreError(err, OperationType.WRITE, 'users');
    }

    const processed = end;
    const percent = Math.min(100, Math.round((processed / total) * 100));

    if (onProgress) {
      onProgress({
        processed,
        total,
        percent,
        currentBatch: batchIndex + 1,
        totalBatches,
        statusText: `Importation du lot ${batchIndex + 1}/${totalBatches} (${processed}/${total} contacts)...`,
      });
    }

    // Small delay to allow UI refresh and prevent Firestore connection saturation
    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  const skippedCount = contacts.length - (importedCount + updatedCount + errorCount);

  return {
    importedCount,
    updatedCount,
    skippedCount,
    errorCount,
    errors,
  };
}
