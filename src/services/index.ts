/**
 * Services Index
 * Export all services for easy importing
 */

export { api, type ApiResponse, type ApiError } from './api';
export { authService, mapRoleToUserType, mapUserTypeToRole } from './authService';
export { contactService } from './contactService';
export { nodniService } from './nodniService';
export { commonDdlService } from './commonDdlService';
export { ferfarService } from './ferfarService';
export { karAakaraniService } from './karAakaraniService';
export { vasuliService } from './vasuliService';
export { certificateService } from './certificateService';
export { helplineService, type HelplineContact, type HelplinePayload } from './helplineService';
export { postService, type GpPost, type GpPostPayload } from './postService';
export { appLockService, type LockSettings } from './appLockService';
export { waterMeterService, WATER_MONTHS, type WaterMeter, type WaterReading, type WaterMeterPayload } from './waterMeterService';
