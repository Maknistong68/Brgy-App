import { useCallback } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useAuthStore } from '@/stores/authStore';
import * as documentService from '@/services/document';
import type { DocumentRequestStatus, PaymentStatus } from '@/types';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Document requests hook.
 *
 * Provides an API for loading, creating, and managing document requests
 * while keeping the document store synchronised with the server.
 *
 * Usage:
 * ```ts
 * const { documents, isLoading, loadDocuments, createRequest } = useDocumentRequests();
 * ```
 */
export function useDocumentRequests() {
  const {
    documents,
    selectedDocument,
    filters,
    pagination,
    isLoading,
    error,
    setDocuments,
    addDocument,
    updateDocument,
    setSelectedDocument,
    setFilters,
    resetFilters,
    setPage,
    setLoading,
    setError,
  } = useDocumentStore();

  const { profile } = useAuthStore();

  // -----------------------------------------------------------------------
  // Load document requests with current filters
  // -----------------------------------------------------------------------

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, count, error: fetchError } = await documentService.getDocumentRequests({
        barangayId: profile?.barangay_id ?? undefined,
        status: filters.status as DocumentRequestStatus | undefined,
        documentType: filters.type as any,
        search: filters.search || undefined,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });

      if (fetchError) {
        setError(fetchError.message);
        return { error: fetchError };
      }

      if (data) {
        setDocuments(data as any);
      }

      return { data, count };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load documents';
      setError(message);
      return { error: new Error(message) };
    } finally {
      setLoading(false);
    }
  }, [profile?.barangay_id, filters, pagination.page, pagination.pageSize]);

  // -----------------------------------------------------------------------
  // Load a single document request by ID
  // -----------------------------------------------------------------------

  const loadDocument = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await documentService.getDocumentRequestById(id);

      if (fetchError) {
        setError(fetchError.message);
        return { error: fetchError };
      }

      if (data) {
        setSelectedDocument(data as any);
      }

      return { data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load document';
      setError(message);
      return { error: new Error(message) };
    } finally {
      setLoading(false);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Create a new document request
  // -----------------------------------------------------------------------

  const createRequest = useCallback(
    async (requestData: documentService.CreateDocumentRequestData) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: createError } = await documentService.createDocumentRequest(requestData);

        if (createError) {
          setError(createError.message);
          return { data: null, error: createError };
        }

        if (data) {
          addDocument(data as any);
        }

        return { data, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create document request';
        setError(message);
        return { data: null, error: new Error(message) };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Update document request status
  // -----------------------------------------------------------------------

  const updateStatus = useCallback(
    async (id: string, status: string, notes?: string) => {
      if (!profile?.id) return { data: null, error: new Error('Not authenticated') };

      setLoading(true);
      setError(null);

      try {
        const { data, error: updateError } = await documentService.updateDocumentStatus(
          id,
          status as DocumentRequestStatus,
          profile.id,
          notes,
        );

        if (updateError) {
          setError(updateError.message);
          return { data: null, error: updateError };
        }

        if (data) {
          updateDocument(id, data as any);
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
  // Update payment status
  // -----------------------------------------------------------------------

  const updatePayment = useCallback(
    async (id: string, paymentStatus: string, amount?: number) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: paymentError } = await documentService.updatePaymentStatus(
          id,
          paymentStatus as PaymentStatus,
          amount,
        );

        if (paymentError) {
          setError(paymentError.message);
          return { data: null, error: paymentError };
        }

        if (data) {
          updateDocument(id, data as any);
        }

        return { data, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update payment';
        setError(message);
        return { data: null, error: new Error(message) };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Refresh documents (reload with current filters)
  // -----------------------------------------------------------------------

  const refreshDocuments = useCallback(async () => {
    return loadDocuments();
  }, [loadDocuments]);

  return {
    // State
    documents,
    selectedDocument,
    filters,
    pagination,
    isLoading,
    error,

    // Actions
    loadDocuments,
    loadDocument,
    createRequest,
    updateStatus,
    updatePayment,
    refreshDocuments,

    // Filter & pagination helpers
    setFilters,
    resetFilters,
    setPage,
    setSelectedDocument,
  };
}
