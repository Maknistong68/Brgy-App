import { create } from 'zustand';

interface Complaint {
  id: string;
  barangay_id: string;
  complainant_id: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'resolved' | 'dismissed';
  location: string | null;
  attachments: string[];
  assigned_to: string | null;
  resolution: string | null;
  created_at: string;
  updated_at: string;
}

interface ComplaintFilters {
  status: string | null;
  priority: string | null;
  category: string | null;
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

interface ComplaintState {
  complaints: Complaint[];
  selectedComplaint: Complaint | null;
  filters: ComplaintFilters;
  pagination: Pagination;
  isLoading: boolean;
  error: string | null;
  setComplaints: (complaints: Complaint[]) => void;
  addComplaint: (complaint: Complaint) => void;
  updateComplaint: (id: string, updates: Partial<Complaint>) => void;
  setSelectedComplaint: (complaint: Complaint | null) => void;
  setFilters: (filters: Partial<ComplaintFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialFilters: ComplaintFilters = {
  status: null,
  priority: null,
  category: null,
  search: '',
  dateRange: {
    start: null,
    end: null,
  },
};

export const useComplaintStore = create<ComplaintState>((set) => ({
  complaints: [],
  selectedComplaint: null,
  filters: initialFilters,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
  isLoading: false,
  error: null,
  setComplaints: (complaints) => set({ complaints }),
  addComplaint: (complaint) =>
    set((state) => ({ complaints: [complaint, ...state.complaints] })),
  updateComplaint: (id, updates) =>
    set((state) => ({
      complaints: state.complaints.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
      selectedComplaint:
        state.selectedComplaint?.id === id
          ? { ...state.selectedComplaint, ...updates }
          : state.selectedComplaint,
    })),
  setSelectedComplaint: (selectedComplaint) => set({ selectedComplaint }),
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
