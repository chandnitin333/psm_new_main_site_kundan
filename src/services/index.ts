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
export type { MyPayment, MyPaymentsResponse, DashboardKpis, Defaulter, MonthlyCollection, Ghosvara, GhosvaraRow, BulkReminderResult, PropertyLedger } from './vasuliService';
export { certificateService } from './certificateService';
export { helplineService, type HelplineContact, type HelplinePayload } from './helplineService';
export { postService, type GpPost, type GpPostPayload } from './postService';
export { appLockService, type LockSettings } from './appLockService';
export { waterMeterService, WATER_MONTHS, type WaterMeter, type WaterReading, type WaterMeterPayload, type WaterPayment, type WaterPaymentsResponse, type FieldMeter, type FieldMetersResponse } from './waterMeterService';
export { grievanceService, type Grievance, type GrievanceStatus, type GrievanceEvent } from './grievanceService';
export { citizenNotificationService, type CitizenNotification, type NotifCategory, type NotifTarget, type CitizenOption } from './citizenNotificationService';
