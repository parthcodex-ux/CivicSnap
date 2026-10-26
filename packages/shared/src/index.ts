import { z } from 'zod';

// ==========================================
// 1. Enums & Core Identifiers
// ==========================================

export const IssueCategoryEnum = z.enum([
  'POTHOLE',
  'GARBAGE_DUMP',
  'BROKEN_STREETLIGHT',
  'WATER_LEAKAGE',
  'DRAINAGE_OVERFLOW',
  'DAMAGED_SIDEWALK',
  'FALLEN_TREE',
  'OTHER'
]);
export type IssueCategory = z.infer<typeof IssueCategoryEnum>;

export const SeverityLevelEnum = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
]);
export type SeverityLevel = z.infer<typeof SeverityLevelEnum>;

export const EvidenceQualityEnum = z.enum([
  'EXCELLENT',
  'ACCEPTABLE',
  'POOR',
  'UNUSABLE'
]);
export type EvidenceQuality = z.infer<typeof EvidenceQualityEnum>;

export const ComplaintStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'IN_REVIEW',
  'IN_PROGRESS',
  'RESOLVED',
  'REJECTED',
  'DISPUTED'
]);
export type ComplaintStatus = z.infer<typeof ComplaintStatusEnum>;

export const SubmissionModeEnum = z.enum([
  'DIRECT_API',
  'ASSISTED_PORTAL',
  'OFFLINE_READY'
]);
export type SubmissionMode = z.infer<typeof SubmissionModeEnum>;

export const ResolutionCitizenStatusEnum = z.enum([
  'FULLY_RESOLVED',
  'PARTIALLY_RESOLVED',
  'STILL_UNRESOLVED'
]);
export type ResolutionCitizenStatus = z.infer<typeof ResolutionCitizenStatusEnum>;

// ==========================================
// 2. AI Gemma 4 Analysis Contract
// ==========================================

export const ProposedDraftSchema = z.object({
  title: z.string().min(5).max(120),
  bodyEn: z.string().min(20).max(1500),
  bodyHi: z.string().min(20).max(1500),
  urgencyRationale: z.string().max(500)
});
export type ProposedDraft = z.infer<typeof ProposedDraftSchema>;

export const EvidenceQualityReportSchema = z.object({
  rating: EvidenceQualityEnum,
  isBlurry: z.boolean(),
  isNightTime: z.boolean(),
  issueClearlyVisible: z.boolean(),
  recommendations: z.array(z.string()).default([])
});
export type EvidenceQualityReport = z.infer<typeof EvidenceQualityReportSchema>;

export const AIAnalysisResultSchema = z.object({
  issueCategory: IssueCategoryEnum,
  conciseDescription: z.string().min(10).max(500),
  severity: SeverityLevelEnum,
  severityExplanation: z.string().min(10).max(500),
  visibleEvidence: z.array(z.string()).min(1),
  uncertainties: z.array(z.string()).default([]),
  confidenceScore: z.number().min(0).max(1),
  confidenceLabel: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  missingInformation: z.array(z.string()).default([]),
  proposedDraft: ProposedDraftSchema,
  evidenceQuality: EvidenceQualityReportSchema,
  analyzedAt: z.string().datetime(),
  modelName: z.string()
});
export type AIAnalysisResult = z.infer<typeof AIAnalysisResultSchema>;

// Request contract for AI image analysis
export const AnalyzeImageRequestSchema = z.object({
  userDescription: z.string().max(1000).optional(),
  preferredLanguage: z.enum(['en', 'hi']).default('en'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional()
});
export type AnalyzeImageRequest = z.infer<typeof AnalyzeImageRequestSchema>;

// ==========================================
// 3. Authority Resolution Contracts
// ==========================================

export const AuthorityConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  department: z.string(),
  jurisdiction: z.string(),
  state: z.string(),
  district: z.string(),
  city: z.string().optional(),
  supportedCategories: z.array(IssueCategoryEnum),
  submissionMode: SubmissionModeEnum,
  submissionEndpoint: z.string().url().optional(),
  portalUrl: z.string().url().optional(),
  helpdeskPhone: z.string().optional(),
  helpdeskEmail: z.string().email().optional(),
  requiredFields: z.array(z.string()).default([]),
  slaHours: z.number().int().positive().default(72),
  isVerifiedAuthority: z.boolean().default(true)
});
export type AuthorityConfig = z.infer<typeof AuthorityConfigSchema>;

export const ResolveAuthorityRequestSchema = z.object({
  category: IssueCategoryEnum,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  addressText: z.string().optional()
});
export type ResolveAuthorityRequest = z.infer<typeof ResolveAuthorityRequestSchema>;

export const ResolveAuthorityResponseSchema = z.object({
  authority: AuthorityConfigSchema,
  matchingExplanation: z.string(),
  submissionMode: SubmissionModeEnum,
  portalGuidance: z.object({
    directUrl: z.string().url().optional(),
    instructions: z.array(z.string()),
    requiredCitizenData: z.array(z.string())
  }).optional()
});
export type ResolveAuthorityResponse = z.infer<typeof ResolveAuthorityResponseSchema>;

// ==========================================
// 4. Duplicate Check Contract
// ==========================================

export const NearbyDuplicateQuerySchema = z.object({
  category: IssueCategoryEnum,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().min(10).max(500).default(60),
  lookbackDays: z.number().int().min(1).max(60).default(14)
});
export type NearbyDuplicateQuery = z.infer<typeof NearbyDuplicateQuerySchema>;

export const PotentialDuplicateSchema = z.object({
  complaintId: z.string(),
  category: IssueCategoryEnum,
  title: z.string(),
  distanceMeters: z.number(),
  createdAt: z.string().datetime(),
  status: ComplaintStatusEnum,
  thumbnailUrl: z.string().optional()
});
export type PotentialDuplicate = z.infer<typeof PotentialDuplicateSchema>;

export const DuplicateCheckResponseSchema = z.object({
  hasDuplicates: z.boolean(),
  duplicates: z.array(PotentialDuplicateSchema),
  message: z.string()
});
export type DuplicateCheckResponse = z.infer<typeof DuplicateCheckResponseSchema>;

// ==========================================
// 5. Complaint Submission & Entity Contracts
// ==========================================

export const CreateComplaintRequestSchema = z.object({
  category: IssueCategoryEnum,
  title: z.string().min(5).max(120),
  description: z.string().min(15).max(2000),
  language: z.enum(['en', 'hi']).default('en'),
  severity: SeverityLevelEnum,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(3).max(300),
  authorityId: z.string(),
  photoStoragePath: z.string().min(5),
  evidenceQualityRating: EvidenceQualityEnum.default('ACCEPTABLE'),
  aiAnalysisRaw: AIAnalysisResultSchema.optional(),
  userConsentGranted: z.boolean().refine(val => val === true, {
    message: 'Explicit citizen consent is required before filing a civic complaint'
  }),
  isAssistedDraft: z.boolean().default(false)
});
export type CreateComplaintRequest = z.infer<typeof CreateComplaintRequestSchema>;

export const ComplaintStatusHistoryEntrySchema = z.object({
  id: z.string(),
  complaintId: z.string(),
  fromStatus: ComplaintStatusEnum.nullable(),
  toStatus: ComplaintStatusEnum,
  changedByRole: z.enum(['CITIZEN', 'AUTHORITY_API', 'ASSISTED_PORTAL', 'SYSTEM']),
  reasonOrNote: z.string().nullable().optional(),
  officialReference: z.string().nullable().optional(),
  createdAt: z.string().datetime()
});
export type ComplaintStatusHistoryEntry = z.infer<typeof ComplaintStatusHistoryEntrySchema>;

export const ComplaintRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  category: IssueCategoryEnum,
  title: z.string(),
  description: z.string(),
  language: z.enum(['en', 'hi']),
  severity: SeverityLevelEnum,
  latitude: z.number(),
  longitude: z.number(),
  address: z.string(),
  authorityId: z.string(),
  authorityName: z.string().optional(),
  status: ComplaintStatusEnum,
  submissionMode: SubmissionModeEnum,
  officialReferenceId: z.string().nullable().optional(),
  photoUrl: z.string().url().optional(),
  evidenceQualityRating: EvidenceQualityEnum,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable().optional(),
  history: z.array(ComplaintStatusHistoryEntrySchema).optional()
});
export type ComplaintRecord = z.infer<typeof ComplaintRecordSchema>;

// ==========================================
// 6. Resolution Feedback & Dispute Contracts
// ==========================================

export const SubmitFeedbackRequestSchema = z.object({
  citizenResolutionStatus: ResolutionCitizenStatusEnum,
  satisfactionRating: z.number().int().min(1).max(5),
  comments: z.string().max(1000).optional(),
  resolutionEvidenceStoragePath: z.string().optional(),
  disputeReason: z.string().max(1000).optional()
});
export type SubmitFeedbackRequest = z.infer<typeof SubmitFeedbackRequestSchema>;

export const ResolutionFeedbackRecordSchema = z.object({
  id: z.string(),
  complaintId: z.string(),
  userId: z.string(),
  citizenResolutionStatus: ResolutionCitizenStatusEnum,
  satisfactionRating: z.number().int().min(1).max(5),
  comments: z.string().nullable().optional(),
  resolutionEvidenceUrl: z.string().url().nullable().optional(),
  isDisputed: z.boolean().default(false),
  disputeReason: z.string().nullable().optional(),
  createdAt: z.string().datetime()
});
export type ResolutionFeedbackRecord = z.infer<typeof ResolutionFeedbackRecordSchema>;

// ==========================================
// 7. Aggregate Analytics Contract
// ==========================================

export const ResolutionAnalyticsSchema = z.object({
  totalComplaints: z.number().int().nonnegative(),
  resolvedCount: z.number().int().nonnegative(),
  disputedCount: z.number().int().nonnegative(),
  inProgressCount: z.number().int().nonnegative(),
  averageResolutionHours: z.number().nullable(),
  citizenSatisfactionAverage: z.number().nullable(),
  categoryBreakdown: z.record(IssueCategoryEnum, z.number().int().nonnegative()),
  hasSufficientData: z.boolean()
});
export type ResolutionAnalytics = z.infer<typeof ResolutionAnalyticsSchema>;

// ==========================================
// 8. Standard API Response Wrappers
// ==========================================

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  })
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema
  });
