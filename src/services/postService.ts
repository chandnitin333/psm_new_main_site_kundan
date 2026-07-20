/**
 * Gram Panchayat Posts / Announcements — citizen feed + notifications.
 */
import { api, type ApiResponse } from './api';

export interface GpPost {
  id: number;
  gram_panchayat_id?: number | null;
  category: string | null;
  title: string | null;
  body: string | null;
  image_path: string | null;
  is_pinned?: number;
  publish_at?: string | null;
  expiry_at?: string | null;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GpPostPayload {
  category?: string;
  title?: string;
  body?: string;
  image_path?: string;
  is_pinned?: number | boolean;
  publish_at?: string | null;
  expiry_at?: string | null;
  is_active?: number | boolean;
}

const ENDPOINTS = {
  LIST: '/main/posts/list',
  CREATE: '/main/posts',
  UPDATE: (id: number) => `/main/posts/${id}`,
  DELETE: (id: number) => `/main/posts/${id}`,
  IMAGE: '/main/posts/image',
  UNREAD: '/main/posts/unread-count',
  MARK_READ: '/main/posts/mark-read',
  VAPID: '/main/posts/vapid-key',
  SUBSCRIBE: '/main/posts/subscribe',
} as const;

export const postService = {
  list: async (): Promise<ApiResponse<GpPost[]>> => api.get(ENDPOINTS.LIST),
  create: async (payload: GpPostPayload): Promise<ApiResponse> => api.post(ENDPOINTS.CREATE, payload),
  update: async (id: number, payload: GpPostPayload): Promise<ApiResponse> => api.put(ENDPOINTS.UPDATE(id), payload),
  remove: async (id: number): Promise<ApiResponse> => api.delete(ENDPOINTS.DELETE(id)),
  uploadImage: async (file: File): Promise<ApiResponse<{ image_path: string }>> => {
    const fd = new FormData();
    fd.append('image', file);
    return api.upload<{ image_path: string }>(ENDPOINTS.IMAGE, fd);
  },
  unreadCount: async (): Promise<ApiResponse<{ unread: number }>> => api.get(ENDPOINTS.UNREAD),
  markRead: async (): Promise<ApiResponse> => api.post(ENDPOINTS.MARK_READ, {}),
  getVapidKey: async (): Promise<ApiResponse<{ public_key: string }>> => api.get(ENDPOINTS.VAPID),
  subscribePush: async (sub: PushSubscriptionJSON): Promise<ApiResponse> => api.post(ENDPOINTS.SUBSCRIBE, sub),
};

export default postService;
