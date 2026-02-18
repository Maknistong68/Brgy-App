import { useCallback } from 'react';
import { useComplaintStore } from '@/stores/complaintStore';
import { useAuthStore } from '@/stores/authStore';
import * as complaintService from '@/services/complaint';
import type { ComplaintStatus } from '@/types';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Complaints hook.
 *
 * Provides an API for loading, creating, and managing complaints while
 * keeping the complaint store synchronised with the server.
 *
 * Usage:
 * ```ts
 * const { complaints, isLoading, loadComplaints, createComplaint } = useComplaints();
 * ```
 */
export function useComplaints() {
  const {
    complaints,
    selectedComplaint,
    filters,
    pagination,
    isLoading,
    error,
    setComplaints,
    addComplaint,
    updateComplaint,
    setSelectedComplaint,
    setFilters,
    resetFilters,
    setPage,
    setLoading,
    setError,
  } = useComplaintStore();

  const { profile } = useAuthStore();

  // -----------------------------------------------------------------------
  // Load complaints with current filters
  // -----------------------------------------------------------------------

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, count, error: fetchError } = await complaintService.getComplaints({
        barangayId: profile?.barangay_id ?? undefined,
        status: filters.status as ComplaintStatus | undefined,
        priority: filters.priority as any,
        category: filters.category as any,
        search: filters.search || undefined,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });

      if (fetchError) {
        setError(fetchError.message);
        return { error: fetchError };
      }

      if (data) {
        setComplaints(data as any);
      }

      return { data, count };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load complaints';
      setError(message);
      return { error: new Error(message) };
    } finally {
      setLoading(false);
    }
  }, [profile?.barangay_id, filters, pagination.page, pagination.pageSize]);

  // -----------------------------------------------------------------------
  // Load a single complaint by ID
  // -----------------------------------------------------------------------

  const loadComplaint = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await complaintService.getComplaintById(id);

      if (fetchError) {
        setError(fetchError.message);
        return { error: fetchError };
      }

      if (data) {
        setSelectedComplaint(data as any);
      }

      return { data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load complaint';
      setError(message);
      return { error: new Error(message) };
    } finally {
      setLoading(false);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Create a new complaint
  // -----------------------------------------------------------------------

  const createComplaint = useCallback(
    async (complaintData: complaintService.CreateComplaintData) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: createError } = await complaintService.createComplaint(complaintData);

        if (createError) {
          setError(createError.message);
          return { data: null, error: createError };
        }

        if (data) {
          addComplaint(data as any);
        }

        return { data, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create complaint';
        setError(message);
        return { data: null, error: new Error(message) };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Update complaint status
  // -----------------------------------------------------------------------

  const updateStatus = useCallback(
    async (id: string, status: string, notes?: string) => {
      if (!profile?.id) return { data: null, error: new Error('Not authenticated') };

      setLoading(true);
      setError(null);

      try {
        const { data, error: updateError } = await complaintService.updateComplaintStatus(
          id,
          status as ComplaintStatus,
          profile.id,
          notes,
        );

        if (updateError) {
          setError(updateError.message);
          return { data: null, error: updateError };
        }

        if (data) {
          updateComplaint(id, data as any);
        }

        return { data, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update status';
        setError(message);
        return { data: null, error: new Error(message) };
      } finally {
        setLoading(false);
      }
    },
    [profile?.id],
  );

  // -----------------------------------------------------------------------
  // Assign complaint to a staff member
  // -----------------------------------------------------------------------

  const assignTo = useCallback(
    async (id: string, assigneeId: string) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: assignError } = await complaintService.assignComplaint(id, assigneeId);

        if (assignError) {
          setError(assignError.message);
          return { data: null, error: assignError };
        }

        if (data) {
          updateComplaint(id, { assigned_to: assigneeId } as any);
        }

        return { data, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to assign complaint';
        setError(message);
        return { data: null, error: new Error(message) };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Add a comment to a complaint
  // -----------------------------------------------------------------------

  const addComment = useCallback(
    async (id: string, content: string, isInternal: boolean = false) => {
      if (!profile?.id) return { data: null, error: new Error('Not authenticated') };

      try {
        const { data, error: commentError } = await complaintService.addComment(
          id,
          profile.id,
          content,
          isInternal,
        );

        if (commentError) {
          return { data: null, error: commentError };
        }

        return { data, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add comment';
        return { data: null, error: new Error(message) };
      }
    },
    [profile?.id],
  );

  // -----------------------------------------------------------------------
  // Refresh complaints (reload with current filters)
  // -----------------------------------------------------------------------

  const refreshComplaints = useCallback(async () => {
    return loadComplaints();
  }, [loadComplaints]);

  return {
    // State
    complaints,
    selectedComplaint,
    filters,
    pagination,
    isLoading,
    error,

    // Actions
    loadComplaints,
    loadComplaint,
    createComplaint,
    updateStatus,
    assignTo,
    addComment,
    refreshComplaints,

    // Filter & pagination helpers
    setFilters,
    resetFilters,
    setPage,
    setSelectedComplaint,
  };
}
