import { UserProfile } from '../types';

/**
 * Télécharge un contact unique au format VCF
 */
export function downloadSingleBzkContact(profile: UserProfile): void {
  const vCardContent = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${profile.displayName}`,
    `N:${profile.displayName};;;;`,
    `TEL;TYPE=CELL:${profile.phone}`,
    `NOTE:BZK FOLDER Contact (${profile.country})`,
    'END:VCARD',
  ].join('\r\n');

  const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `BZK_${profile.firstName.replace(/\s+/g, '_')}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Télécharge l'intégralité du répertoire BZK FOLDER au format VCF (Pour le propriétaire)
 */
export function downloadAllBzkContacts(contacts: UserProfile[]): void {
  if (!contacts || contacts.length === 0) return;

  const vCardEntries = contacts.map((c) =>
    [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${c.displayName}`,
      `N:${c.displayName};;;;`,
      `TEL;TYPE=CELL:${c.phone}`,
      `NOTE:BZK FOLDER Contact - ${c.country}`,
      'END:VCARD',
    ].join('\r\n')
  );

  const fullContent = vCardEntries.join('\r\n\r\n');
  const blob = new Blob([fullContent], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const timestamp = new Date().toISOString().slice(0, 10);
  link.download = `BZK_FOLDER_CONTACTS_${timestamp}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
