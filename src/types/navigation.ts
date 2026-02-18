import { ComplaintCategory, ComplaintStatus, DocumentRequestStatus, DocumentType } from './enums';

// ---------------------------------------------------------------------------
// Root Stack
// ---------------------------------------------------------------------------

export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
  '+not-found': undefined;
};

// ---------------------------------------------------------------------------
// Auth Routes
// ---------------------------------------------------------------------------

export type AuthStackParamList = {
  login: undefined;
  register: undefined;
  'forgot-password': undefined;
  'reset-password': { token: string };
  'verify-email': { email: string };
};

// ---------------------------------------------------------------------------
// Tab Routes
// ---------------------------------------------------------------------------

export type TabParamList = {
  index: undefined;
  complaints: undefined;
  documents: undefined;
  notifications: undefined;
  profile: undefined;
};

// ---------------------------------------------------------------------------
// Complaint Routes
// ---------------------------------------------------------------------------

export type ComplaintStackParamList = {
  index: undefined;
  '[id]': { id: string };
  create: undefined;
  edit: { id: string };
  hearing: { id: string; complaintId: string };
};

// ---------------------------------------------------------------------------
// Document Routes
// ---------------------------------------------------------------------------

export type DocumentStackParamList = {
  index: undefined;
  '[id]': { id: string };
  request: { type?: DocumentType };
};

// ---------------------------------------------------------------------------
// Profile Routes
// ---------------------------------------------------------------------------

export type ProfileStackParamList = {
  index: undefined;
  edit: undefined;
  settings: undefined;
};

// ---------------------------------------------------------------------------
// Admin Routes
// ---------------------------------------------------------------------------

export type AdminStackParamList = {
  dashboard: undefined;
  residents: undefined;
  'residents/[id]': { id: string };
  complaints: undefined;
  documents: undefined;
  announcements: undefined;
  'announcements/create': undefined;
  'announcements/[id]': { id: string };
  'fee-schedule': undefined;
  'audit-log': undefined;
  settings: undefined;
};

// ---------------------------------------------------------------------------
// Common route params used across screens
// ---------------------------------------------------------------------------

export type ComplaintFilterParams = {
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  search?: string;
};

export type DocumentFilterParams = {
  status?: DocumentRequestStatus;
  type?: DocumentType;
  search?: string;
};
