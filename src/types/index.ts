export type Gender = 'male' | 'female';

export interface UserProfile {
  id: string;
  phone: string;
  phoneNormalized: string;
  firstName: string;
  displayName: string;
  badge: string;
  gender: Gender;
  country: string;
  profilePhoto?: string;
  consent: boolean;
  statusSharingAllowed: boolean;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  status?: string;
  email?: string;
  sharesCount?: number;
  addsCount?: number;
}

export interface StatusItem {
  id: string;
  userId: string;
  userDisplayName: string;
  userBadge: string;
  userPhoto?: string;
  content: string;
  mediaUrl?: string;
  mediaType: 'text' | 'image' | 'video';
  createdAt: string;
  expiresAt: string;
  visibility: 'public' | 'contacts';
  likesCount?: number;
}

export interface AdminLogItem {
  id: string;
  timestamp: string;
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'EXPORT_CONTACTS' | 'DELETE_USER' | 'DELETE_ALL_USERS' | 'UPDATE_USER' | 'DOWNLOAD_EXPORT' | 'ADMIN_ACTION';
  result: 'SUCCESS' | 'FAILED';
  resourceId?: string;
  details?: string;
  ip?: string;
}

export interface AdminStats {
  totalContacts: number;
  maleContacts: number;
  femaleContacts: number;
  newToday: number;
  newThisWeek: number;
  activeAccounts: number;
  sharedStatuses: number;
  countryBreakdown: Record<string, number>;
}
