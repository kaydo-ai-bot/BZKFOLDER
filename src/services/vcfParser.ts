import { Gender } from '../types';
import { cleanRawFirstName, normalizePhoneNumber, generateBadgeAndDisplayName } from './users';

export interface RawParsedVcard {
  rawName: string;
  rawPhones: string[];
  gender?: Gender;
  notes?: string;
}

export interface PreparedVcfContact {
  id: string;
  originalName: string;
  cleanFirstName: string;
  displayName: string;
  badge: string;
  rawPhone: string;
  phoneNormalized: string;
  gender: Gender;
  country: string;
  status: 'ready' | 'already_in_db' | 'duplicate_in_file' | 'invalid';
  reason?: string;
  existingId?: string;
  existingCreatedAt?: string;
}

export interface VcfAnalysisResult {
  totalDetected: number;
  readyCount: number;
  alreadyInDbCount: number;
  duplicateInFileCount: number;
  invalidCount: number;
  contacts: PreparedVcfContact[];
}

/**
 * Decode Quoted-Printable strings commonly found in vCard 2.1 (e.g. from Android / Samsung / older exports)
 * Supports multi-byte UTF-8 sequences (=C3=A9 -> é) and ISO-8859-1.
 */
export function decodeQuotedPrintable(input: string, charset = 'utf-8'): string {
  if (!input) return '';
  // Unfold soft line breaks (= followed by CRLF or LF)
  const unwrapped = input.replace(/=\r?\n/g, '');

  const bytes: number[] = [];
  for (let i = 0; i < unwrapped.length; i++) {
    if (unwrapped[i] === '=' && i + 2 < unwrapped.length) {
      const hex = unwrapped.substring(i + 1, i + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 2;
        continue;
      }
    }
    bytes.push(unwrapped.charCodeAt(i));
  }

  try {
    const isIso = charset.toLowerCase().includes('iso') || charset.toLowerCase().includes('latin');
    const decoder = new TextDecoder(isIso ? 'iso-8859-1' : 'utf-8', { fatal: false });
    return decoder.decode(new Uint8Array(bytes));
  } catch {
    return unwrapped;
  }
}

/**
 * Unfold vCard lines folded according to RFC 2425 / RFC 6350 (CRLF followed by space or tab).
 */
export function unfoldVcfLines(vcfText: string): string[] {
  // Replace CRLF+space or CRLF+tab with nothing
  const unfolded = vcfText.replace(/\r?\n[ \t]/g, '');
  return unfolded.split(/\r?\n/);
}

/**
 * Infer probable country from a normalized phone number prefix.
 */
export function inferCountryFromPhone(phoneNormalized: string): string {
  if (phoneNormalized.startsWith('+509')) return 'Haïti (+509)';
  if (phoneNormalized.startsWith('+33')) return 'France (+33)';
  if (phoneNormalized.startsWith('+1')) return 'États-Unis / Canada (+1)';
  if (phoneNormalized.startsWith('+225')) return "Côte d'Ivoire (+225)";
  if (phoneNormalized.startsWith('+221')) return 'Sénégal (+221)';
  if (phoneNormalized.startsWith('+237')) return 'Cameroun (+237)';
  if (phoneNormalized.startsWith('+241')) return 'Gabon (+241)';
  if (phoneNormalized.startsWith('+212')) return 'Maroc (+212)';
  if (phoneNormalized.startsWith('+32')) return 'Belgique (+32)';
  if (phoneNormalized.startsWith('+41')) return 'Suisse (+41)';
  return 'Haïti (+509)';
}

/**
 * Infer gender from name if it contains explicit emojis or keywords, else fallback.
 */
export function inferGenderFromName(name: string, defaultGender: Gender = 'male'): Gender {
  if (!name) return defaultGender;
  if (name.includes('🌸') || /\b(fille|girl|dame|madame|mme|miss|soeur)\b/i.test(name)) {
    return 'female';
  }
  if (name.includes('🥷') || /\b(garcon|garçon|boy|monsieur|mr|frere|frère)\b/i.test(name)) {
    return 'male';
  }
  return defaultGender;
}

/**
 * Parse raw text of a .vcf file into structured vCard entries.
 */
export function parseVcfRaw(vcfText: string): RawParsedVcard[] {
  const lines = unfoldVcfLines(vcfText);
  const results: RawParsedVcard[] = [];

  let inVcard = false;
  let currentFN = '';
  let currentN = '';
  let currentPhones: string[] = [];
  let currentNotes = '';

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/^BEGIN:VCARD/i.test(line)) {
      inVcard = true;
      currentFN = '';
      currentN = '';
      currentPhones = [];
      currentNotes = '';
      continue;
    }

    if (/^END:VCARD/i.test(line)) {
      if (inVcard) {
        // Resolve best name
        let finalName = currentFN || currentN || '';
        finalName = finalName.trim();

        if (finalName || currentPhones.length > 0) {
          results.push({
            rawName: finalName || 'CONTACT INCONNU',
            rawPhones: currentPhones,
            notes: currentNotes,
          });
        }
      }
      inVcard = false;
      continue;
    }

    if (!inVcard) continue;

    // Handle Formatted Name (FN)
    if (/^(?:item\d+\.)?FN[;: ]/i.test(line)) {
      const parts = line.split(':');
      const propHeader = parts[0];
      let val = parts.slice(1).join(':');

      if (/QUOTED-PRINTABLE/i.test(propHeader)) {
        const charset = /CHARSET=([^;:]+)/i.exec(propHeader)?.[1] || 'utf-8';
        val = decodeQuotedPrintable(val, charset);
      }
      currentFN = val.trim();
      continue;
    }

    // Handle Structured Name (N)
    if (/^(?:item\d+\.)?N[;: ]/i.test(line) && !currentFN) {
      const parts = line.split(':');
      const propHeader = parts[0];
      let val = parts.slice(1).join(':');

      if (/QUOTED-PRINTABLE/i.test(propHeader)) {
        const charset = /CHARSET=([^;:]+)/i.exec(propHeader)?.[1] || 'utf-8';
        val = decodeQuotedPrintable(val, charset);
      }
      // N structure: Family;Given;Additional;Prefix;Suffix
      const nameParts = val.split(';').map((s) => s.trim()).filter(Boolean);
      if (nameParts.length > 1) {
        // Given + Family
        currentN = `${nameParts[1]} ${nameParts[0]}`.trim();
      } else if (nameParts.length === 1) {
        currentN = nameParts[0];
      }
      continue;
    }

    // Handle Phone Numbers (TEL)
    if (/^(?:item\d+\.)?TEL[;: ]/i.test(line)) {
      const parts = line.split(':');
      const propHeader = parts[0];
      let val = parts.slice(1).join(':');

      if (/QUOTED-PRINTABLE/i.test(propHeader)) {
        const charset = /CHARSET=([^;:]+)/i.exec(propHeader)?.[1] || 'utf-8';
        val = decodeQuotedPrintable(val, charset);
      }
      const cleaned = val.trim();
      if (cleaned) {
        currentPhones.push(cleaned);
      }
      continue;
    }

    // Handle Note
    if (/^(?:item\d+\.)?NOTE[;: ]/i.test(line)) {
      const parts = line.split(':');
      currentNotes = parts.slice(1).join(':').trim();
    }
  }

  return results;
}

/**
 * Prepares and categorizes contacts for preview and database importation.
 * Detects duplicates internally and against current database records.
 */
export function prepareContactsForImport(
  rawCards: RawParsedVcard[],
  existingNormalizedPhonesMap: Map<string, { id: string; displayName: string; createdAt?: string }>,
  options: {
    defaultGender: Gender;
    defaultCountry?: string;
  }
): VcfAnalysisResult {
  const prepared: PreparedVcfContact[] = [];
  const seenInFilePhones = new Set<string>();

  let readyCount = 0;
  let alreadyInDbCount = 0;
  let duplicateInFileCount = 0;
  let invalidCount = 0;

  for (let card of rawCards) {
    const originalName = card.rawName || 'MEMBRE';
    const gender = card.gender || inferGenderFromName(originalName, options.defaultGender);
    const { firstName: cleanFirstName, badge, displayName } = generateBadgeAndDisplayName(originalName, gender);

    // A card might have multiple phones; if empty, mark invalid
    if (!card.rawPhones || card.rawPhones.length === 0) {
      invalidCount++;
      prepared.push({
        id: `vcf_invalid_${Math.random().toString(36).substring(2, 9)}`,
        originalName,
        cleanFirstName,
        displayName,
        badge,
        rawPhone: '',
        phoneNormalized: '',
        gender,
        country: options.defaultCountry || 'Haïti (+509)',
        status: 'invalid',
        reason: 'Aucun numéro de téléphone trouvé dans la fiche VCF.',
      });
      continue;
    }

    // For each phone number found on the card
    for (let rawPhone of card.rawPhones) {
      const norm = normalizePhoneNumber(rawPhone, options.defaultCountry);

      // Check if valid phone digits
      const digitsOnly = norm.replace(/\D/g, '');
      if (!digitsOnly || digitsOnly.length < 7) {
        invalidCount++;
        prepared.push({
          id: `vcf_invalid_${Math.random().toString(36).substring(2, 9)}`,
          originalName,
          cleanFirstName,
          displayName,
          badge,
          rawPhone,
          phoneNormalized: norm,
          gender,
          country: options.defaultCountry || 'Haïti (+509)',
          status: 'invalid',
          reason: `Numéro trop court ou incomplet (${rawPhone})`,
        });
        continue;
      }

      const country = inferCountryFromPhone(norm);

      // Check if duplicate within this file
      if (seenInFilePhones.has(norm)) {
        duplicateInFileCount++;
        prepared.push({
          id: `vcf_file_dup_${Math.random().toString(36).substring(2, 9)}`,
          originalName,
          cleanFirstName,
          displayName,
          badge,
          rawPhone,
          phoneNormalized: norm,
          gender,
          country,
          status: 'duplicate_in_file',
          reason: 'Numéro répété plusieurs fois dans le même fichier VCF (ignoré pour éviter les doublons).',
        });
        continue;
      }
      seenInFilePhones.add(norm);

      // Check if already in Firestore database
      if (existingNormalizedPhonesMap.has(norm)) {
        const existing = existingNormalizedPhonesMap.get(norm)!;
        alreadyInDbCount++;
        prepared.push({
          id: `vcf_db_dup_${Math.random().toString(36).substring(2, 9)}`,
          originalName,
          cleanFirstName,
          displayName,
          badge,
          rawPhone,
          phoneNormalized: norm,
          gender,
          country,
          status: 'already_in_db',
          reason: `Déjà présent dans BZK FOLDER sous le nom "${existing.displayName}".`,
          existingId: existing.id,
          existingCreatedAt: existing.createdAt,
        });
        continue;
      }

      // Valid and ready!
      readyCount++;
      prepared.push({
        id: `vcf_ready_${Math.random().toString(36).substring(2, 9)}`,
        originalName,
        cleanFirstName,
        displayName,
        badge,
        rawPhone,
        phoneNormalized: norm,
        gender,
        country,
        status: 'ready',
      });
    }
  }

  return {
    totalDetected: prepared.length,
    readyCount,
    alreadyInDbCount,
    duplicateInFileCount,
    invalidCount,
    contacts: prepared,
  };
}
