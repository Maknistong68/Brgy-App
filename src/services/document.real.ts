import { supabase } from '@/lib/supabase';
import { STORAGE_BUCKETS, PAGINATION } from '@/constants';
import { canTransitionDocumentStatus } from '@/utils/permissions';
import type {
  DocumentRequest,
  DocumentRequestWithRelations,
  DocumentRequestStatusHistory,
  DocumentRequestAttachment,
  DocumentFeeSchedule,
  Profile,
} from '@/types';
import {
  DocumentRequestStatus,
  DocumentType,
  PaymentStatus,
} from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DocumentFilters {
  barangayId?: string;
  status?: DocumentRequestStatus;
  documentType?: DocumentType;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateDocumentRequestData {
  barangay_id: string;
  requestor_id: string;
  document_type: DocumentType;
  purpose: string;
  form_data: Record<string, unknown>;
}

export interface FileInput {
  uri: string;
  name: string;
  type: string;
  size: number;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface PaginatedResponse<T> {
  data: T[] | null;
  count: number;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Document Requests
// ---------------------------------------------------------------------------

/**
 * List document requests with optional filters and pagination.
 */
export async function getDocumentRequests(
  filters: DocumentFilters,
): Promise<PaginatedResponse<DocumentRequestWithRelations>> {
  try {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('document_requests')
      .select(
        `
        *,
        requestor:profiles!requestor_id (
          id, first_name, last_name, avatar_url, phone, email
        )
      `,
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters.barangayId) {
      query = query.eq('barangay_id', filters.barangayId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.documentType) {
      query = query.eq('document_type', filters.documentType);
    }

    if (filters.search) {
      query = query.or(
        `reference_number.ilike.%${filters.search}%,purpose.ilike.%${filters.search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      return { data: null, count: 0, error };
    }

    return {
      data: data as unknown as DocumentRequestWithRelations[],
      count: count ?? 0,
      error: null,
    };
  } catch (error) {
    return { data: null, count: 0, error: error as Error };
  }
}

/**
 * Fetch a single document request with related profiles.
 */
export async function getDocumentRequestById(
  id: string,
): Promise<ServiceResponse<DocumentRequestWithRelations>> {
  try {
    const { data, error } = await supabase
      .from('document_requests')
      .select(
        `
        *,
        requestor:profiles!requestor_id (
          id, first_name, last_name, avatar_url, phone, email, address, purok
        ),
        processor:profiles!processed_by (
          id, first_name, last_name, avatar_url, role
        ),
        approver:profiles!approved_by (
          id, first_name, last_name, avatar_url, role
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as unknown as DocumentRequestWithRelations, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new document request.
 */
export async function createDocumentRequest(
  input: CreateDocumentRequestData,
): Promise<ServiceResponse<DocumentRequest>> {
  try {
    const { data, error } = await supabase
      .from('document_requests')
      .insert({
        barangay_id: input.barangay_id,
        requestor_id: input.requestor_id,
        document_type: input.document_type,
        purpose: input.purpose,
        form_data: input.form_data,
        status: DocumentRequestStatus.SUBMITTED,
        payment_status: PaymentStatus.PENDING,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as DocumentRequest, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update fields on an existing document request.
 */
export async function updateDocumentRequest(
  id: string,
  updates: Partial<DocumentRequest>,
): Promise<ServiceResponse<DocumentRequest>> {
  try {
    const { data, error } = await supabase
      .from('document_requests')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as DocumentRequest, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Transition a document request to a new status and record the change in
 * the history table.
 */
export async function updateDocumentStatus(
  id: string,
  newStatus: DocumentRequestStatus,
  changedBy: string,
  notes?: string,
): Promise<ServiceResponse<DocumentRequest>> {
  try {
    // Fetch current status + updated_at for optimistic locking
    const { data: current, error: fetchError } = await supabase
      .from('document_requests')
      .select('status, updated_at')
      .eq('id', id)
      .single();

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    const { status: previousStatus, updated_at: currentUpdatedAt } =
      current as { status: DocumentRequestStatus; updated_at: string };

    // Validate status transition
    if (!canTransitionDocumentStatus(previousStatus, newStatus)) {
      return {
        data: null,
        error: new Error(`Invalid status transition from '${previousStatus}' to '${newStatus}'`),
      };
    }

    // Enforce payment before release
    if (newStatus === DocumentRequestStatus.FOR_RELEASE) {
      const { data: docData, error: docError } = await supabase
        .from('document_requests')
        .select('payment_status, amount')
        .eq('id', id)
        .single();

      if (docError) {
        return { data: null, error: docError };
      }

      const doc = docData as { payment_status: string; amount: number | null };
      const requiresPayment = doc.amount != null && doc.amount > 0;
      const isPaid = doc.payment_status === PaymentStatus.PAID || doc.payment_status === PaymentStatus.WAIVED;

      if (requiresPayment && !isPaid) {
        return {
          data: null,
          error: new Error('Payment must be completed or waived before releasing the document'),
        };
      }
    }

    // Build the update payload
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === DocumentRequestStatus.RELEASED) {
      updatePayload.released_at = new Date().toISOString();
    }

    if (newStatus === DocumentRequestStatus.REJECTED && notes) {
      updatePayload.rejection_reason = notes;
    }

    // Update document request with optimistic locking
    const { data, error: updateError } = await supabase
      .from('document_requests')
      .update(updatePayload)
      .eq('id', id)
      .eq('updated_at', currentUpdatedAt)
      .select()
      .single();

    if (!data && !updateError) {
      return {
        data: null,
        error: new Error('This document request was modified by another user. Please refresh and try again.'),
      };
    }

    if (updateError) {
      return { data: null, error: updateError };
    }

    // Insert history entry
    const { error: historyError } = await supabase
      .from('document_request_status_history')
      .insert({
        document_request_id: id,
        from_status: previousStatus,
        to_status: newStatus,
        changed_by: changedBy,
        notes: notes ?? null,
      });

    if (historyError) {
      console.warn(
        'Failed to insert document request status history:',
        historyError,
      );
    }

    return { data: data as DocumentRequest, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update the payment status (and optionally the amount) on a document
 * request.
 */
export async function updatePaymentStatus(
  id: string,
  paymentStatus: PaymentStatus,
  amount?: number,
): Promise<ServiceResponse<DocumentRequest>> {
  try {
    const updatePayload: Record<string, unknown> = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    };

    if (amount !== undefined) {
      updatePayload.amount = amount;
    }

    const { data, error } = await supabase
      .from('document_requests')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as DocumentRequest, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ---------------------------------------------------------------------------
// Status History
// ---------------------------------------------------------------------------

/**
 * Get the full status history for a document request.
 */
export async function getStatusHistory(
  requestId: string,
): Promise<ServiceResponse<(DocumentRequestStatusHistory & { changed_by_profile?: Profile })[]>> {
  try {
    const { data, error } = await supabase
      .from('document_request_status_history')
      .select(
        `
        *,
        changed_by_profile:profiles!changed_by (
          id, first_name, last_name, avatar_url, role
        )
      `,
      )
      .eq('document_request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) {
      return { data: null, error };
    }

    return {
      data: data as unknown as (DocumentRequestStatusHistory & { changed_by_profile?: Profile })[],
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------

/**
 * Get all attachments for a document request.
 */
export async function getAttachments(
  requestId: string,
): Promise<ServiceResponse<DocumentRequestAttachment[]>> {
  try {
    const { data, error } = await supabase
      .from('document_request_attachments')
      .select('*')
      .eq('document_request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) {
      return { data: null, error };
    }

    return { data: data as DocumentRequestAttachment[], error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Upload a file to storage and create an attachment record for the given
 * document request.
 */
export async function addAttachment(
  requestId: string,
  uploadedBy: string,
  file: FileInput,
): Promise<ServiceResponse<DocumentRequestAttachment>> {
  try {
    const timestamp = Date.now();
    const filePath = `${requestId}/${timestamp}_${file.name}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.DOCUMENT_ATTACHMENTS)
      .upload(filePath, {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as File);

    if (uploadError) {
      return { data: null, error: uploadError };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.DOCUMENT_ATTACHMENTS)
      .getPublicUrl(filePath);

    // Create attachment record
    const { data, error } = await supabase
      .from('document_request_attachments')
      .insert({
        document_request_id: requestId,
        uploaded_by: uploadedBy,
        file_name: file.name,
        file_path: filePath,
        mime_type: file.type,
        file_size: file.size,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as DocumentRequestAttachment, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ---------------------------------------------------------------------------
// Fee Schedule
// ---------------------------------------------------------------------------

/**
 * Get the full fee schedule for a barangay.
 */
export async function getFeeSchedule(
  barangayId: string,
): Promise<ServiceResponse<DocumentFeeSchedule[]>> {
  try {
    const { data, error } = await supabase
      .from('document_fee_schedule')
      .select('*')
      .eq('barangay_id', barangayId)
      .eq('is_active', true)
      .order('document_type', { ascending: true });

    if (error) {
      return { data: null, error };
    }

    return { data: data as DocumentFeeSchedule[], error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Look up the fee for a specific document type in a barangay.
 */
export async function getFee(
  barangayId: string,
  documentType: DocumentType,
): Promise<ServiceResponse<DocumentFeeSchedule>> {
  try {
    const { data, error } = await supabase
      .from('document_fee_schedule')
      .select('*')
      .eq('barangay_id', barangayId)
      .eq('document_type', documentType)
      .eq('is_active', true)
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as DocumentFeeSchedule, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ---------------------------------------------------------------------------
// Soft Delete (Archive)
// ---------------------------------------------------------------------------

/**
 * Soft-delete a document request by setting archived_at. Only captain+ should call this.
 */
export async function archiveDocumentRequest(
  id: string,
): Promise<ServiceResponse<DocumentRequest>> {
  try {
    const { data, error } = await supabase
      .from('document_requests')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as DocumentRequest, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
