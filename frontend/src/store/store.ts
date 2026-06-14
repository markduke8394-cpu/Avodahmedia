import { create } from 'zustand';
import api from '../api/client';

interface Lead {
  id: number;
  uuid: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
  platform_name?: string;
  status: string;
  priority: string;
  assigned_to?: number;
  assigned_to_name?: string;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
}

interface DashboardStats {
  total_leads_today: number;
  new_leads: number;
  qualified_leads: number;
  closed_won: number;
  conversion_rate: number;
}

interface Store {
  isAuthenticated: boolean;
  user: TeamMember | null;
  leads: Lead[];
  selectedLead: Lead | null;
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;

  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchLeads: (filters?: any) => Promise<void>;
  fetchLead: (id: number) => Promise<void>;
  fetchStats: () => Promise<void>;
  updateLeadStatus: (id: number, status: string) => Promise<void>;
  reassignLead: (id: number, assignedTo: number) => Promise<void>;
  updateLeadPriority: (id: number, priority: string) => Promise<void>;
  clearError: () => void;
}

export const useStore = create<Store>((set) => ({
  isAuthenticated: false,
  user: null,
  leads: [],
  selectedLead: null,
  stats: null,
  loading: false,
  error: null,

  checkAuth: async () => {
    try {
      const response = await api.get('/auth/me');
      set({ isAuthenticated: true, user: response.data });
    } catch {
      set({ isAuthenticated: false, user: null });
    }
  },

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      set({
        isAuthenticated: true,
        user: response.data.user,
        loading: false,
      });
      localStorage.setItem('token', response.data.token);
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Login failed',
        loading: false,
      });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout', {});
      localStorage.removeItem('token');
      set({ isAuthenticated: false, user: null, leads: [], stats: null });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  fetchLeads: async (filters?: any) => {
    set({ loading: true });
    try {
      const response = await api.get('/leads', { params: filters });
      set({ leads: response.data, loading: false });
    } catch (error: any) {
      set({
        error: error.message,
        loading: false,
      });
    }
  },

  fetchLead: async (id: number) => {
    set({ loading: true });
    try {
      const response = await api.get(`/leads/${id}`);
      set({ selectedLead: response.data, loading: false });
    } catch (error: any) {
      set({
        error: error.message,
        loading: false,
      });
    }
  },

  fetchStats: async () => {
    try {
      const response = await api.get('/dashboard/stats');
      set({ stats: response.data });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  updateLeadStatus: async (id: number, status: string) => {
    set({ loading: true });
    try {
      const response = await api.patch(`/leads/${id}/status`, { status });
      set((state) => ({
        leads: state.leads.map((lead) =>
          lead.id === id ? { ...lead, status } : lead
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message,
        loading: false,
      });
    }
  },

  reassignLead: async (id: number, assignedTo: number) => {
    set({ loading: true });
    try {
      await api.patch(`/leads/${id}/assign`, { assignedTo });
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message,
        loading: false,
      });
    }
  },

  updateLeadPriority: async (id: number, priority: string) => {
    set({ loading: true });
    try {
      await api.patch(`/leads/${id}/priority`, { priority });
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message,
        loading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
