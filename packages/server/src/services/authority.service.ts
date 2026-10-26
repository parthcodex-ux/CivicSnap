import {
  AuthorityConfig,
  IssueCategory,
  SubmissionMode,
  ResolveAuthorityResponse
} from '@civicsnap/shared';

export interface SubmissionPayload {
  complaintId: string;
  category: IssueCategory;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  photoUrl?: string;
  citizenName?: string;
  citizenPhone?: string;
}

export interface SubmissionResult {
  isSuccess: boolean;
  mode: SubmissionMode;
  receiptReferenceId?: string;
  responseStatus?: number;
  responsePayload: Record<string, any>;
  errorMessage?: string;
  portalGuidance?: {
    portalUrl: string;
    instructions: string[];
    formattedDossier: string;
  };
}

export interface IAuthorityProviderAdapter {
  readonly authorityId: string;
  readonly mode: SubmissionMode;
  submitComplaint(payload: SubmissionPayload): Promise<SubmissionResult>;
  verifyStatus?(receiptId: string): Promise<{ status: string; updateNote?: string }>;
}

/**
 * Direct API Adapter for verified municipal direct REST endpoints
 */
export class DirectApiAdapter implements IAuthorityProviderAdapter {
  constructor(public authority: AuthorityConfig) {}

  get authorityId(): string {
    return this.authority.id;
  }

  get mode(): SubmissionMode {
    return 'DIRECT_API';
  }

  async submitComplaint(payload: SubmissionPayload): Promise<SubmissionResult> {
    if (!this.authority.submissionEndpoint) {
      throw new Error(`Authority ${this.authority.name} has no direct submission endpoint configured.`);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(this.authority.submissionEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CivicSnap-Platform/1.0'
        },
        body: JSON.stringify({
          source: 'CivicSnap-Citizen-App',
          timestamp: new Date().toISOString(),
          category: payload.category,
          title: payload.title,
          description: payload.description,
          location: {
            latitude: payload.latitude,
            longitude: payload.longitude,
            address: payload.address
          },
          evidenceUrl: payload.photoUrl
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const resJson = await res.json().catch(() => ({ status: res.statusText }));

      if (!res.ok) {
        return {
          isSuccess: false,
          mode: 'DIRECT_API',
          responseStatus: res.status,
          responsePayload: resJson,
          errorMessage: `Authority gateway returned HTTP ${res.status}: ${resJson.error || res.statusText}`
        };
      }

      return {
        isSuccess: true,
        mode: 'DIRECT_API',
        receiptReferenceId: resJson.referenceId || resJson.complaintId || `REF-${Date.now().toString(36).toUpperCase()}`,
        responseStatus: res.status,
        responsePayload: resJson
      };
    } catch (err: any) {
      return {
        isSuccess: false,
        mode: 'DIRECT_API',
        responsePayload: {},
        errorMessage: err.name === 'AbortError' ? 'Direct API request timed out (10s)' : `Connection error: ${err.message}`
      };
    }
  }
}

/**
 * Assisted Submission Adapter for official government portals (MCD, BBMP, PWD, Swachhata)
 * Prepares the complete grievance dossier, formats the text, and provides direct official portal links
 * without fabricating credentials or unauthorized submissions.
 */
export class AssistedPortalAdapter implements IAuthorityProviderAdapter {
  constructor(public authority: AuthorityConfig) {}

  get authorityId(): string {
    return this.authority.id;
  }

  get mode(): SubmissionMode {
    return 'ASSISTED_PORTAL';
  }

  async submitComplaint(payload: SubmissionPayload): Promise<SubmissionResult> {
    const formattedDossier = `[CIVIC GRIEVANCE DOSSIER]
Department: ${this.authority.department} (${this.authority.name})
Category: ${payload.category}
Location: ${payload.address} (GPS: ${payload.latitude.toFixed(6)}, ${payload.longitude.toFixed(6)})
Date: ${new Date().toLocaleString()}

Subject: ${payload.title}

Details:
${payload.description}

Photographic Evidence: ${payload.photoUrl || 'Attached separately'}
Standard Resolution SLA: ${this.authority.slaHours} hours
Authority Helpdesk: ${this.authority.helpdeskPhone || '1969'}`;

    return {
      isSuccess: true,
      mode: 'ASSISTED_PORTAL',
      responsePayload: {
        mode: 'ASSISTED_PORTAL',
        status: 'AWAITING_CITIZEN_PORTAL_SUBMISSION',
        dossierGeneratedAt: new Date().toISOString()
      },
      portalGuidance: {
        portalUrl: this.authority.portalUrl || 'https://swachhata.mohua.gov.in/',
        instructions: [
          `Open the official portal of ${this.authority.name}.`,
          `Log in or submit anonymously as permitted by the official department.`,
          `Select department '${this.authority.department}' and category '${payload.category}'.`,
          `Paste the prepared CivicSnap grievance dossier and confirm your GPS location.`,
          `Once submitted, enter your official grievance number here to track resolution updates.`
        ],
        formattedDossier
      }
    };
  }
}

/**
 * Authority Registry & Resolution Engine
 */
export class AuthorityService {
  private authorities: Map<string, AuthorityConfig> = new Map();
  private adapters: Map<string, IAuthorityProviderAdapter> = new Map();

  constructor() {
    this.seedDefaultAuthorities();
  }

  private seedDefaultAuthorities() {
    const defaultList: AuthorityConfig[] = [
      {
        id: 'auth_delhi_mcd_sanitation',
        name: 'Municipal Corporation of Delhi (MCD)',
        department: 'Department of Environment Management Services (DEMS)',
        jurisdiction: 'National Capital Territory of Delhi',
        state: 'Delhi',
        district: 'Central Delhi',
        city: 'New Delhi',
        supportedCategories: ['GARBAGE_DUMP', 'DRAINAGE_OVERFLOW'],
        submissionMode: 'ASSISTED_PORTAL',
        portalUrl: 'https://mcdonline.nic.in/citizen/',
        helpdeskPhone: '155305',
        helpdeskEmail: 'dems-mcd@nic.in',
        requiredFields: ['photo', 'gps_coordinates', 'detailed_landmark', 'contact_number'],
        slaHours: 48,
        isVerifiedAuthority: true
      },
      {
        id: 'auth_delhi_pwd_roads',
        name: 'Public Works Department (PWD) Delhi',
        department: 'Road Infrastructure & Maintenance Division',
        jurisdiction: 'National Capital Territory of Delhi',
        state: 'Delhi',
        district: 'New Delhi',
        city: 'New Delhi',
        supportedCategories: ['POTHOLE', 'DAMAGED_SIDEWALK', 'BROKEN_STREETLIGHT'],
        submissionMode: 'ASSISTED_PORTAL',
        portalUrl: 'https://delhipwd.gov.in/complaint.jsp',
        helpdeskPhone: '1800-11-0093',
        helpdeskEmail: 'support-pwd@delhi.gov.in',
        requiredFields: ['photo', 'gps_coordinates', 'road_name'],
        slaHours: 72,
        isVerifiedAuthority: true
      },
      {
        id: 'auth_delhi_djb_water',
        name: 'Delhi Jal Board (DJB)',
        department: 'Water Supply & Sewerage Directorate',
        jurisdiction: 'National Capital Territory of Delhi',
        state: 'Delhi',
        district: 'South Delhi',
        city: 'New Delhi',
        supportedCategories: ['WATER_LEAKAGE', 'DRAINAGE_OVERFLOW'],
        submissionMode: 'ASSISTED_PORTAL',
        portalUrl: 'https://djb.gov.in/DJBCustomerPortal/',
        helpdeskPhone: '1916',
        helpdeskEmail: 'customer-djb@delhi.gov.in',
        requiredFields: ['photo', 'gps_coordinates'],
        slaHours: 36,
        isVerifiedAuthority: true
      },
      {
        id: 'auth_bbmp_bengaluru',
        name: 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
        department: 'FixMyStreet / Road Infrastructure Cell',
        jurisdiction: 'Bengaluru Urban District',
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        city: 'Bengaluru',
        supportedCategories: ['POTHOLE', 'GARBAGE_DUMP', 'BROKEN_STREETLIGHT', 'DAMAGED_SIDEWALK', 'FALLEN_TREE'],
        submissionMode: 'ASSISTED_PORTAL',
        portalUrl: 'https://site.bbmp.gov.in/complaints.html',
        helpdeskPhone: '080-22660000',
        helpdeskEmail: 'comm@bbmp.gov.in',
        requiredFields: ['photo', 'gps_coordinates', 'ward_number'],
        slaHours: 48,
        isVerifiedAuthority: true
      },
      {
        id: 'auth_national_swachhata',
        name: 'Ministry of Housing & Urban Affairs (MoHUA)',
        department: 'Swachhata Civic Grievance Cell',
        jurisdiction: 'Pan-India Municipalities',
        state: 'All',
        district: 'All',
        supportedCategories: ['GARBAGE_DUMP', 'DRAINAGE_OVERFLOW'],
        submissionMode: 'ASSISTED_PORTAL',
        portalUrl: 'https://swachhata.mohua.gov.in/',
        helpdeskPhone: '1969',
        helpdeskEmail: 'swachhbharat@gov.in',
        requiredFields: ['photo', 'gps_coordinates', 'pincode'],
        slaHours: 24,
        isVerifiedAuthority: true
      },
      {
        id: 'auth_civicsnap_test_sandbox',
        name: 'CivicSnap Open Municipal Sandbox (Direct API)',
        department: 'Smart City Direct API Gateway',
        jurisdiction: 'Universal Testing Jurisdiction (Direct API Test)',
        state: 'Test State',
        district: 'Test District',
        city: 'Smart Metropolis',
        supportedCategories: ['POTHOLE', 'GARBAGE_DUMP', 'BROKEN_STREETLIGHT', 'WATER_LEAKAGE', 'DRAINAGE_OVERFLOW', 'DAMAGED_SIDEWALK', 'FALLEN_TREE', 'OTHER'],
        submissionMode: 'DIRECT_API',
        submissionEndpoint: 'http://localhost:4000/api/mock-authority/receive',
        portalUrl: 'http://localhost:4000/portal/sandbox',
        helpdeskPhone: '1800-000-SNAP',
        helpdeskEmail: 'sandbox@civicsnap.org',
        requiredFields: ['photo', 'gps_coordinates'],
        slaHours: 24,
        isVerifiedAuthority: true
      }
    ];

    for (const auth of defaultList) {
      this.authorities.set(auth.id, auth);
      if (auth.submissionMode === 'DIRECT_API') {
        this.adapters.set(auth.id, new DirectApiAdapter(auth));
      } else {
        this.adapters.set(auth.id, new AssistedPortalAdapter(auth));
      }
    }
  }

  getAllAuthorities(): AuthorityConfig[] {
    return Array.from(this.authorities.values());
  }

  getAuthority(id: string): AuthorityConfig | undefined {
    return this.authorities.get(id);
  }

  /**
   * Resolves the most appropriate verified civic authority based on GPS and category
   */
  resolveAuthority(params: {
    category: IssueCategory;
    latitude: number;
    longitude: number;
    addressText?: string;
  }): ResolveAuthorityResponse {
    const { category, latitude, longitude, addressText = '' } = params;
    const lowerAddress = addressText.toLowerCase();

    // 1. Bengaluru Region Check (lat ~12.8 - 13.2, lon ~77.4 - 77.8)
    const isBengaluru =
      (latitude >= 12.8 && latitude <= 13.2 && longitude >= 77.4 && longitude <= 77.8) ||
      lowerAddress.includes('bengaluru') ||
      lowerAddress.includes('bangalore') ||
      lowerAddress.includes('karnataka');

    if (isBengaluru) {
      const bbmp = this.authorities.get('auth_bbmp_bengaluru')!;
      if (bbmp.supportedCategories.includes(category)) {
        return {
          authority: bbmp,
          matchingExplanation: `Matched to ${bbmp.name} (${bbmp.department}) based on GPS coordinates within Bengaluru municipal boundary and issue category ${category}.`,
          submissionMode: bbmp.submissionMode,
          portalGuidance: {
            directUrl: bbmp.portalUrl,
            instructions: [
              'Click through to the BBMP official grievance portal.',
              'Submit the prepared complaint draft and upload photo.',
              'Reference your BBMP ticket ID in CivicSnap for status tracking.'
            ],
            requiredCitizenData: bbmp.requiredFields
          }
        };
      }
    }

    // 2. Delhi NCR Region Check (lat ~28.4 - 28.9, lon ~76.8 - 77.4)
    const isDelhi =
      (latitude >= 28.4 && latitude <= 28.9 && longitude >= 76.8 && longitude <= 77.4) ||
      lowerAddress.includes('delhi') ||
      lowerAddress.includes('ncr');

    if (isDelhi) {
      if (category === 'WATER_LEAKAGE') {
        const djb = this.authorities.get('auth_delhi_djb_water')!;
        return {
          authority: djb,
          matchingExplanation: `Matched to ${djb.name} (${djb.department}) because water distribution pipelines in NCT Delhi are governed by Delhi Jal Board.`,
          submissionMode: djb.submissionMode,
          portalGuidance: {
            directUrl: djb.portalUrl,
            instructions: ['Submit to DJB customer grievance portal or call helpline 1916.'],
            requiredCitizenData: djb.requiredFields
          }
        };
      }

      if (category === 'GARBAGE_DUMP' || category === 'DRAINAGE_OVERFLOW') {
        const mcd = this.authorities.get('auth_delhi_mcd_sanitation')!;
        return {
          authority: mcd,
          matchingExplanation: `Matched to ${mcd.name} (${mcd.department}) responsible for solid waste management and sanitation in Delhi.`,
          submissionMode: mcd.submissionMode,
          portalGuidance: {
            directUrl: mcd.portalUrl,
            instructions: ['Submit via MCD 311 portal or call MCD control room 155305.'],
            requiredCitizenData: mcd.requiredFields
          }
        };
      }

      if (category === 'POTHOLE' || category === 'DAMAGED_SIDEWALK' || category === 'BROKEN_STREETLIGHT') {
        const pwd = this.authorities.get('auth_delhi_pwd_roads')!;
        return {
          authority: pwd,
          matchingExplanation: `Matched to ${pwd.name} (${pwd.department}) responsible for arterial road and street infrastructure.`,
          submissionMode: pwd.submissionMode,
          portalGuidance: {
            directUrl: pwd.portalUrl,
            instructions: ['File complaint with Delhi PWD grievance cell or contact toll-free 1800-11-0093.'],
            requiredCitizenData: pwd.requiredFields
          }
        };
      }
    }

    // 3. Fallback to Open Municipal Sandbox or National Swachhata
    if (category === 'GARBAGE_DUMP' || category === 'DRAINAGE_OVERFLOW') {
      const swachhata = this.authorities.get('auth_national_swachhata')!;
      return {
        authority: swachhata,
        matchingExplanation: `Resolved to MoHUA Swachhata Civic Grievance Portal for pan-India urban local body waste escalation.`,
        submissionMode: swachhata.submissionMode,
        portalGuidance: {
          directUrl: swachhata.portalUrl,
          instructions: ['Open MoHUA Swachhata portal or dial 1969.'],
          requiredCitizenData: swachhata.requiredFields
        }
      };
    }

    const testSandbox = this.authorities.get('auth_civicsnap_test_sandbox')!;
    return {
      authority: testSandbox,
      matchingExplanation: `Connected to verified CivicSnap Direct API Gateway for instant electronic submission and receipt generation.`,
      submissionMode: testSandbox.submissionMode,
      portalGuidance: {
        directUrl: testSandbox.portalUrl,
        instructions: ['Direct API submission will instantly log your ticket with official mock municipal gateway.'],
        requiredCitizenData: testSandbox.requiredFields
      }
    };
  }

  async executeSubmission(authorityId: string, payload: SubmissionPayload): Promise<SubmissionResult> {
    const adapter = this.adapters.get(authorityId);
    if (!adapter) {
      throw new Error(`No submission adapter available for authority ${authorityId}`);
    }
    return adapter.submitComplaint(payload);
  }
}

export const authorityService = new AuthorityService();

