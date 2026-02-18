import { create } from 'zustand';

interface Document {
  id: string;
  barangay_id: string;
  requester_id: string;
  document_type: string;
  purpose: string;
  status: 'pending' | 'processing' | 'ready' | 'claimed' | 'rejected';
  remarks: string | null;
  or_number: string | null;
  amount: number | null;
  scheduled_date: string | null;
  completed_at: string | null;
  attachments: string[];
  created_at: string;
  updated_at: string;
}

interface DocumentFilters {
  status: string | null;
  type: string | null;
  search: string;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

interface DocumentState {
  documents: Document[];
  selectedDocument: Document | null;
  filters: DocumentFilters;
  pagination: Pagination;
  isLoading: boolean;
  error: string | null;
  setDocuments: (documents: Document[]) => void;
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  setSelectedDocument: (document: Document | null) => void;
  setFilters: (filters: Partial<DocumentFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialFilters: DocumentFilters = {
  status: null,
  type: null,
  search: '',
  dateRange: {
    start: null,
    end: null,
  },
};

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  selectedDocument: null,
  filters: initialFilters,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
  isLoading: false,
  error: null,
  setDocuments: (documents) => set({ documents }),
  addDocument: (document) =>
    set((state) => ({ documents: [document, ...state.documents] })),
  updateDocument: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
      selectedDocument:
        state.selectedDocument?.id === id
          ? { ...state.selectedDocument, ...updates }
          : state.selectedDocument,
    })),
  setSelectedDocument: (selectedDocument) => set({ selectedDocument }),
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 },
    })),
  resetFilters: () =>
    set((state) => ({
      filters: initialFilters,
      pagination: { ...state.pagination, page: 1 },
    })),
  setPage: (page) =>
    set((state) => ({ pagination: { ...state.pagination, page } })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
