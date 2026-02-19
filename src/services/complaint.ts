import * as mock from './__mocks__/complaint.mock';
import * as real from './complaint.real';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// Re-export types
export type {
  ComplaintFilters,
  CreateComplaintData,
  FileInput,
  ServiceResponse,
  PaginatedResponse,
} from './complaint.real';

// Re-export functions — mock or real based on env var
export const getComplaints = USE_MOCK ? mock.getComplaints : real.getComplaints;
export const getComplaintById = USE_MOCK ? mock.getComplaintById : real.getComplaintById;
export const createComplaint = USE_MOCK ? mock.createComplaint : real.createComplaint;
export const updateComplaint = USE_MOCK ? mock.updateComplaint : real.updateComplaint;
export const updateComplaintStatus = USE_MOCK ? mock.updateComplaintStatus : real.updateComplaintStatus;
export const assignComplaint = USE_MOCK ? mock.assignComplaint : real.assignComplaint;
export const getStatusHistory = USE_MOCK ? mock.getStatusHistory : real.getStatusHistory;
export const getComments = USE_MOCK ? mock.getComments : real.getComments;
export const addComment = USE_MOCK ? mock.addComment : real.addComment;
export const getAttachments = USE_MOCK ? mock.getAttachments : real.getAttachments;
export const addAttachment = USE_MOCK ? mock.addAttachment : real.addAttachment;
export const archiveComplaint = USE_MOCK ? mock.archiveComplaint : real.archiveComplaint;
