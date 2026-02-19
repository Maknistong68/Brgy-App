import * as mock from './__mocks__/document.mock';
import * as real from './document.real';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// Re-export types
export type {
  DocumentFilters,
  CreateDocumentRequestData,
  FileInput,
  ServiceResponse,
  PaginatedResponse,
} from './document.real';

// Re-export functions — mock or real based on env var
export const getDocumentRequests = USE_MOCK ? mock.getDocumentRequests : real.getDocumentRequests;
export const getDocumentRequestById = USE_MOCK ? mock.getDocumentRequestById : real.getDocumentRequestById;
export const createDocumentRequest = USE_MOCK ? mock.createDocumentRequest : real.createDocumentRequest;
export const updateDocumentRequest = USE_MOCK ? mock.updateDocumentRequest : real.updateDocumentRequest;
export const updateDocumentStatus = USE_MOCK ? mock.updateDocumentStatus : real.updateDocumentStatus;
export const updatePaymentStatus = USE_MOCK ? mock.updatePaymentStatus : real.updatePaymentStatus;
export const getStatusHistory = USE_MOCK ? mock.getStatusHistory : real.getStatusHistory;
export const getAttachments = USE_MOCK ? mock.getAttachments : real.getAttachments;
export const addAttachment = USE_MOCK ? mock.addAttachment : real.addAttachment;
export const getFeeSchedule = USE_MOCK ? mock.getFeeSchedule : real.getFeeSchedule;
export const getFee = USE_MOCK ? mock.getFee : real.getFee;
export const archiveDocumentRequest = USE_MOCK ? mock.archiveDocumentRequest : real.archiveDocumentRequest;
