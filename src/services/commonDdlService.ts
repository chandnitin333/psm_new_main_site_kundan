/**
 * Common DDL (Dropdown) Service
 * Handles all common dropdown related API calls
 */

import { api, type ApiResponse } from './api';

const DDL_ENDPOINTS = {
  DISTRICT: '/main/common-ddl/district',
  TALUKA: '/main/common-ddl/taluka',
  GRAM_PANCHAYAT: '/main/common-ddl/gram-panchayat',
  GAT_GRAM_PANCHAYAT: '/main/common-ddl/gat-gram-panchayat',
  MALMATTECHE_PRAKAR: '/main/common-ddl/malmatteche-prakar',
  MALMATTA: '/main/common-ddl/malmatta',
  GAVTHAN_BAHERCHE: '/main/common-ddl/gavthan-gavthan-baherche',
  OPEN_PLOT_RATES_BY_ID: '/main/common-ddl/open-plot-rates-by-id',
  BANDKAM_RATES: '/main/common-ddl/bandkam-rates',
  ANNUAL_TAX_RATES: '/main/common-ddl/annual-tax-rates',
  FLOOR: '/main/common-ddl/floor',
  GHASARA_DAR: '/main/common-ddl/ghasara-dar',
  TOWER: '/main/common-ddl/tower',
  FERFAR_YADI: '/main/common-ddl/ferfar-yadi',
  WARD_LIST: '/main/common-ddl/ward-list',
  AADHAR_WARD_LIST: '/main/common-ddl/aadhar-ward-list',
  GP_MEMBERS: '/main/common-ddl/gram-panchayat-members',
  PROFILE: '/main/common-ddl/profile',
  PROFILE_IMAGE: '/main/common-ddl/profile-image',
  CHANGE_PASSWORD: '/main/common-ddl/change-password',
} as const;

export const commonDdlService = {
  /**
   * Get all districts
   */
  getDistricts: async (): Promise<ApiResponse> => {
    return api.get(DDL_ENDPOINTS.DISTRICT);
  },

  /**
   * Get talukas by district_id
   */
  getTalukas: async (districtId: number): Promise<ApiResponse> => {
    return api.post(DDL_ENDPOINTS.TALUKA, { district_id: districtId });
  },

  /**
   * Get gram panchayats by taluka_id
   */
  getGramPanchayats: async (talukaId: number): Promise<ApiResponse> => {
    return api.post(DDL_ENDPOINTS.GRAM_PANCHAYAT, { taluka_id: talukaId });
  },

  /**
   * Get gat gram panchayats by gram_panchayat_id
   */
  getGatGramPanchayats: async (gramPanchayatId: number): Promise<ApiResponse> => {
    return api.post(DDL_ENDPOINTS.GAT_GRAM_PANCHAYAT, { gram_panchayat_id: gramPanchayatId });
  },

  /**
   * Get all malmatteche prakar (property types) for dropdown
   */
  getMalmattechePrakar: async (): Promise<ApiResponse> => {
    return api.get(DDL_ENDPOINTS.MALMATTECHE_PRAKAR);
  },

  /**
   * Get all malmatta (property descriptions) for dropdown
   */
  getMalmatta: async (): Promise<ApiResponse> => {
    return api.get(DDL_ENDPOINTS.MALMATTA);
  },

  /**
   * Get gavthan/gavthan baherche by gat_gram_panchayat_id
   */
  getGavthanBaherche: async (gatGramPanchayatId: number): Promise<ApiResponse> => {
    return api.post(DDL_ENDPOINTS.GAVTHAN_BAHERCHE, { gat_gram_panchayat_id: gatGramPanchayatId });
  },

  /**
   * Get varshik_dar and aakarani_dar from open_plot_rates by id
   */
  getOpenPlotRatesById: async (id: number): Promise<ApiResponse> => {
    return api.post(DDL_ENDPOINTS.OPEN_PLOT_RATES_BY_ID, { id });
  },

  /**
   * Get bharank by malmatteche_prakar_id from bharank_dar table
   */
  getBandkamRates: async (malmattechePrakarId: number): Promise<ApiResponse> => {
    return api.post(DDL_ENDPOINTS.BANDKAM_RATES, { malmatteche_prakar_id: malmattechePrakarId });
  },

  /**
   * Get varshik_mulya_dar and aakarani_dar from annual_tax + annual_tax_data
   */
  /**
   * Get all floors for dropdown
   */
  getFloors: async (): Promise<ApiResponse> => {
    return api.get(DDL_ENDPOINTS.FLOOR);
  },

  getAnnualTaxRates: async (payload: {
    district_id: number;
    taluka_id: number;
    gram_panchayat_id: number;
    gat_gram_panchayat_id: number;
    malmatteche_prakar_id: number;
    malmatta_id: number;
  }): Promise<ApiResponse> => {
    return api.post(DDL_ENDPOINTS.ANNUAL_TAX_RATES, payload);
  },

  /**
   * Get ghasara dar (depreciation rate) by age and malmatta_id
   */
  getGhasaraDar: async (age: number, malmattaId: number): Promise<ApiResponse> => {
    return api.post(DDL_ENDPOINTS.GHASARA_DAR, { age, malmatta_id: malmattaId });
  },

  /**
   * Get all towers for dropdown
   */
  getTowers: async (): Promise<ApiResponse> => {
    return api.get(DDL_ENDPOINTS.TOWER);
  },

  /**
   * Get all ferfar namuna yadi for dropdown
   */
  getFerfarYadi: async (): Promise<ApiResponse> => {
    return api.get(DDL_ENDPOINTS.FERFAR_YADI);
  },

  /**
   * Get distinct ward numbers for the logged-in user's gram panchayat
   */
  getWards: async (): Promise<ApiResponse> => {
    return api.get(DDL_ENDPOINTS.WARD_LIST);
  },

  /**
   * Ward-wise आधार/वोटर कार्ड यादी for the logged-in user
   */
  getAadharWardList: async (ward: string | number): Promise<ApiResponse> => {
    return api.get(`${DDL_ENDPOINTS.AADHAR_WARD_LIST}?ward=${encodeURIComponent(ward)}`);
  },

  /**
   * Gram panchayat members/employees (सरपंच, उपसरपंच, सदस्य) of the logged-in user's GP
   */
  getGramPanchayatMembers: async (): Promise<ApiResponse> => {
    return api.get(DDL_ENDPOINTS.GP_MEMBERS);
  },

  /**
   * Full profile of the currently logged-in user (real data from DB)
   */
  getMyProfile: async (): Promise<ApiResponse> => {
    return api.get(DDL_ENDPOINTS.PROFILE);
  },

  /**
   * Upload / replace the logged-in user's profile image. Updates the DB and
   * returns the new stored relative path { profile_image }.
   */
  uploadMyProfileImage: async (file: File): Promise<ApiResponse<{ profile_image: string }>> => {
    const fd = new FormData();
    fd.append('file', file);
    return api.upload<{ profile_image: string }>(DDL_ENDPOINTS.PROFILE_IMAGE, fd);
  },

  /**
   * Change the logged-in user's own password (verifies old password on the backend)
   */
  changeMyPassword: async (oldPassword: string, newPassword: string): Promise<ApiResponse> => {
    return api.post(DDL_ENDPOINTS.CHANGE_PASSWORD, {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },
};

export default commonDdlService;
