/**
 * Ferfar Service
 * Handles customer_ferfar_yadi CRUD API calls
 */

import { api, type ApiResponse } from './api';

const FERFAR_ENDPOINTS = {
  BASE: '/main/malmatta-ferfar',
  BY_ID: (id: number) => `/main/malmatta-ferfar/${id}`,
  LIST: '/main/malmatta-ferfar/list',
  PDF_UPLOAD: '/main/malmatta-ferfar/pdf/upload',
  PDF_LIST: '/main/malmatta-ferfar/pdf/list',
  PDF_DELETE: (id: number) => `/main/malmatta-ferfar/pdf/${id}`,
} as const;

export const ferfarService = {
  /**
   * Create a new ferfar record
   */
  create: async (payload: Record<string, unknown>): Promise<ApiResponse> => {
    return api.post(FERFAR_ENDPOINTS.BASE, payload);
  },

  /**
   * Update an existing ferfar record
   */
  update: async (id: number, payload: Record<string, unknown>): Promise<ApiResponse> => {
    return api.put(FERFAR_ENDPOINTS.BY_ID(id), payload);
  },

  /**
   * Get ferfar record by ID
   */
  getById: async (id: number): Promise<ApiResponse> => {
    return api.get(FERFAR_ENDPOINTS.BY_ID(id));
  },

  /**
   * List ferfar records with pagination and filters
   */
  list: async (payload: Record<string, unknown>): Promise<ApiResponse> => {
    return api.post(FERFAR_ENDPOINTS.LIST, payload);
  },

  /**
   * Delete a ferfar record
   */
  delete: async (id: number): Promise<ApiResponse> => {
    return api.delete(FERFAR_ENDPOINTS.BY_ID(id));
  },

  /**
   * Upload a PDF for a ferfar record
   */
  uploadPdf: async (ferfarId: number, pdfFile: File, fileName: string): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('ferfar_id', String(ferfarId));
    formData.append('pdf_file', pdfFile);
    formData.append('file_name', fileName);
    return api.upload(FERFAR_ENDPOINTS.PDF_UPLOAD, formData);
  },

  /**
   * List PDFs for a ferfar record
   */
  listPdfs: async (payload: Record<string, unknown>): Promise<ApiResponse> => {
    return api.post(FERFAR_ENDPOINTS.PDF_LIST, payload);
  },

  /**
   * Delete a PDF record
   */
  deletePdf: async (id: number): Promise<ApiResponse> => {
    return api.delete(FERFAR_ENDPOINTS.PDF_DELETE(id));
  },
};

export default ferfarService;
