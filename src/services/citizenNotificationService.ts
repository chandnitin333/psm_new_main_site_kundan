/**
 * Citizen in-app notifications (सूचना).
 * Staff: create / list / delete / citizen-search. Citizen: my / unread-count / read / read-all.
 */
import { api, type ApiResponse } from './api';

const E = {
  BASE: '/main/citizen-notification',
  LIST: '/main/citizen-notification/list',
  DELETE: (id: number) => `/main/citizen-notification/${id}`,
  CITIZEN_SEARCH: '/main/citizen-notification/citizen-search',
  MY: '/main/citizen-notification/my',
  UNREAD: '/main/citizen-notification/my/unread-count',
  READ: (id: number) => `/main/citizen-notification/my/${id}/read`,
  READ_ALL: '/main/citizen-notification/my/read-all',
} as const;

export type NotifCategory = 'kar' | 'pani' | 'general';
export type NotifTarget = 'all' | 'ward' | 'user';

export interface CitizenNotification {
  id: number;
  title: string;
  body: string | null;
  category: NotifCategory;
  created_at: string;
  is_read?: number;             // citizen view
  target_type?: NotifTarget;    // staff view
  ward?: string | null;
  target_user_id?: number | null;
  target_user_name?: string | null;
  read_count?: number;
}

export interface CreateNotificationPayload {
  title: string;
  body?: string;
  category?: NotifCategory;
  target_type: NotifTarget;
  ward?: string;
  target_user_id?: number;
}

export interface CitizenOption { id: number; name: string; mobile_no: string | null; }

export const citizenNotificationService = {
  // staff
  create: (payload: CreateNotificationPayload): Promise<ApiResponse> => api.post(E.BASE, payload),
  list: (): Promise<ApiResponse<{ rows: CitizenNotification[]; total: number }>> => api.get(E.LIST),
  remove: (id: number): Promise<ApiResponse> => api.delete(E.DELETE(id)),
  searchCitizens: (q: string): Promise<ApiResponse<CitizenOption[]>> =>
    api.get(`${E.CITIZEN_SEARCH}?q=${encodeURIComponent(q)}`),
  // citizen
  getMy: (): Promise<ApiResponse<CitizenNotification[]>> => api.get(E.MY),
  getUnreadCount: (): Promise<ApiResponse<{ unread: number }>> => api.get(E.UNREAD),
  markRead: (id: number): Promise<ApiResponse> => api.post(E.READ(id), {}),
  markAllRead: (): Promise<ApiResponse> => api.post(E.READ_ALL, {}),
};

export default citizenNotificationService;
