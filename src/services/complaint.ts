import { supabase } from '@/lib/supabase';
import { STORAGE_BUCKETS, PAGINATION } from '@/constants';
import { canTransitionComplaintStatus } from '@/utils/permissions';
import type {
  Complaint,
  ComplaintWithRelations,
  ComplaintStatusHistory,
  ComplaintComment,
  ComplaintAttachment,
  Profile,
} from '@/types';
import {
  ComplaintStatus,
  ComplaintPriority,
  ComplaintCategory,
} from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComplaintFilters {
  barangayId?: string;
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  category?: ComplaintCategory;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateComplaintData {
  barangay_id: string;
  complainant_id: string;
  respondent_name: string;
  respondent_address?: string;
  category: ComplaintCategory;
  description: string;
  priority?: ComplaintPriority;
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
// Complaints
// ---------------------------------------------------------------------------

/**
 * List complaints with optional filters and pagination.
 *
 * Joins the complainant profile for display purposes.
 */
export async function getComplaints(
  filters: ComplaintFilters,
): Promise<PaginatedResponse<ComplaintWithRelations>> {
  try {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('complaints')
      .select(
        `
        *,
        complainant:profiles!complainant_id (
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

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.search) {
      query = query.or(
        `reference_number.ilike.%${filters.search}%,respondent_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      return { data: null, count: 0, error };
    }

    return {
      data: data as unknown as ComplaintWithRelations[],
      count: count ?? 0,
      error: null,
    };
  } catch (error) {
    return { data: null, count: 0, error: error as Error };
  }
}

/**
 * Fetch a single complaint with its relations (complainant + assigned staff).
 */
export async function getComplaintById(
  id: string,
): Promise<ServiceResponse<ComplaintWithRelations>> {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .select(
        `
        *,
        complainant:profiles!complainant_id (
          id, first_name, last_name, avatar_url, phone, email, address, purok
        ),
        assigned_staff:profiles!assigned_to (
          id, first_name, last_name, avatar_url, phone, email, role
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as unknown as ComplaintWithRelations, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new complaint record.
 */
export async function createComplaint(
  input: CreateComplaintData,
): Promise<ServiceResponse<Complaint>> {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .insert({
        barangay_id: input.barangay_id,
        complainant_id: input.complainant_id,
        respondent_name: input.respondent_name,
        respondent_address: input.respondent_address,
        category: input.category,
        description: input.description,
        priority: input.priority ?? ComplaintPriority.MEDIUM,
        status: ComplaintStatus.SUBMITTED,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Complaint, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Update fields on an existing complaint.
 */
export async function updateComplaint(
  id: string,
  updates: Partial<Complaint>,
): Promise<ServiceResponse<Complaint>> {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Complaint, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Transition a complaint to a new status and record the change in the
 * status history table.
 */
export async function updateComplaintStatus(
  id: string,
  newStatus: ComplaintStatus,
  changedBy: string,
  notes?: string,
): Promise<ServiceResponse<Complaint>> {
  try {
    // Fetch current status + updated_at for optimistic locking
    const { data: current, error: fetchError } = await supabase
      .from('complaints')
      .select('status, updated_at')
      .eq('id', id)
      .single();

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    const { status: previousStatus, updated_at: currentUpdatedAt } =
      current as { status: ComplaintStatus; updated_at: string };

    // Validate status transition
    if (!canTransitionComplaintStatus(previousStatus, newStatus)) {
      return {
        data: null,
        error: new Error(`Invalid status transition from '${previousStatus}' to '${newStatus}'`),
      };
    }

    // Build the update payload
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === ComplaintStatus.RESOLVED) {
      updatePayload.resolved_at = new Date().toISOString();
      if (notes) {
        updatePayload.resolution_notes = notes;
      }
    }

    // Update complaint with optimistic locking
    const { data, error: updateError, count } = await supabase
      .from('complaints')
      .update(updatePayload)
      .eq('id', id)
      .eq('updated_at', currentUpdatedAt)
      .select()
      .single();

    if (!data && !updateError) {
      return {
        data: null,
        error: new Error('This complaint was modified by another user. Please refresh and try again.'),
      };
    }

    if (updateError) {
      return { data: null, error: updateError };
    }

    // Insert status history entry
    const { error: historyError } = await supabase
      .from('complaint_status_history')
      .insert({
        complaint_id: id,
        from_status: previousStatus,
        to_status: newStatus,
        changed_by: changedBy,
        notes: notes ?? null,
      });

    if (historyError) {
      // The status was updated but the history insert failed. Log but still
      // return the updated complaint so callers know the mutation succeeded.
      console.warn('Failed to insert complaint status history:', historyError);
    }

    return { data: data as Complaint, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Assign a complaint to a staff member.
 */
export async function assignComplaint(
  id: string,
  assigneeId: string,
): Promise<ServiceResponse<Complaint>> {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .update({
        assigned_to: assigneeId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Complaint, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ---------------------------------------------------------------------------
// Status History
// ---------------------------------------------------------------------------

/**
 * Get the complete status history for a complaint, ordered chronologically.
 */
export async function getStatusHistory(
  complaintId: string,
): Promise<ServiceResponse<(ComplaintStatusHistory & { changed_by_profile?: Profile })[]>> {
  try {
    const { data, error } = await supabase
      .from('complaint_status_history')
      .select(
        `
        *,
        changed_by_profile:profiles!changed_by (
          id, first_name, last_name, avatar_url, role
        )
      `,
      )
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: true });

    if (error) {
      return { data: null, error };
    }

    return {
      data: data as unknown as (ComplaintStatusHistory & { changed_by_profile?: Profile })[],
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

/**
 * List comments for a complaint. When `includeInternal` is false only
 * public-facing comments are returned.
 */
export async function getComments(
  complaintId: string,
  includeInternal: boolean = false,
): Promise<ServiceResponse<(ComplaintComment & { author?: Profile })[]>> {
  try {
    let query = supabase
      .from('complaint_comments')
      .select(
        `
        *,
        author:profiles!author_id (
          id, first_name, last_name, avatar_url, role
        )
      `,
      )
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: true });

    if (!includeInternal) {
      query = query.eq('is_internal', false);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    return {
      data: data as unknown as (ComplaintComment & { author?: Profile })[],
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Post a new comment on a complaint.
 */
export async function addComment(
  complaintId: string,
  authorId: string,
  content: string,
  isInternal: boolean = false,
): Promise<ServiceResponse<ComplaintComment>> {
  try {
    const { data, error } = await supabase
      .from('complaint_comments')
      .insert({
        complaint_id: complaintId,
        author_id: authorId,
        content,
        is_internal: isInternal,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as ComplaintComment, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------

/**
 * Get all attachments for a complaint.
 */
export async function getAttachments(
  complaintId: string,
): Promise<ServiceResponse<ComplaintAttachment[]>> {
  try {
    const { data, error } = await supabase
      .from('complaint_attachments')
      .select('*')
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: true });

    if (error) {
      return { data: null, error };
    }

    return { data: data as ComplaintAttachment[], error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Upload a file to storage and create an attachment record linked to the
 * given complaint.
 */
export async function addAttachment(
  complaintId: string,
  uploadedBy: string,
  file: FileInput,
): Promise<ServiceResponse<ComplaintAttachment>> {
  try {
    const fileExt = file.name.split('.').pop() ?? 'bin';
    const timestamp = Date.now();
    const filePath = `${complaintId}/${timestamp}_${file.name}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.COMPLAINT_ATTACHMENTS)
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
      .from(STORAGE_BUCKETS.COMPLAINT_ATTACHMENTS)
      .getPublicUrl(filePath);

    // Create attachment record
    const { data, error } = await supabase
      .from('complaint_attachments')
      .insert({
        complaint_id: complaintId,
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

    return { data: data as ComplaintAttachment, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// ---------------------------------------------------------------------------
// Soft Delete (Archive)
// ---------------------------------------------------------------------------

/**
 * Soft-delete a complaint by setting archived_at. Only captain+ should call this.
 */
export async function archiveComplaint(
  id: string,
): Promise<ServiceResponse<Complaint>> {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Complaint, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
