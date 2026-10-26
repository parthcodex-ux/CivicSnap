import {
  AIAnalysisResult,
  AuthorityConfig,
  ComplaintRecord,
  CreateComplaintRequest,
  DuplicateCheckResponse,
  ResolutionAnalytics,
  ResolutionFeedbackRecord,
  ResolveAuthorityResponse,
  SubmitFeedbackRequest
} from '@civicsnap/shared';

const API_BASE = '/api';

export class ApiClient {
  private token: string = 'dev-citizen-101';

  setAuthToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || `Request failed with HTTP ${res.status}`);
    }

    return data.data;
  }

  // 1. AI Analysis
  async analyzeImage(
    file: File,
    userDescription?: string,
    preferredLanguage: 'en' | 'hi' = 'en',
    latitude?: number,
    longitude?: number
  ): Promise<AIAnalysisResult> {
    const formData = new FormData();
    formData.append('photo', file);
    if (userDescription) formData.append('userDescription', userDescription);
    formData.append('preferredLanguage', preferredLanguage);
    if (latitude) formData.append('latitude', latitude.toString());
    if (longitude) formData.append('longitude', longitude.toString());

    return this.request<AIAnalysisResult>('/ai/analyze-image', {
      method: 'POST',
      body: formData
    });
  }

  // 2. Authority Resolution
  async resolveAuthority(params: {
    category: string;
    latitude: number;
    longitude: number;
    addressText?: string;
  }): Promise<ResolveAuthorityResponse> {
    return this.request<ResolveAuthorityResponse>('/authorities/resolve', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // 3. Duplicate Check
  async checkDuplicates(params: {
    category: string;
    latitude: number;
    longitude: number;
    radiusMeters?: number;
    lookbackDays?: number;
  }): Promise<DuplicateCheckResponse> {
    return this.request<DuplicateCheckResponse>('/complaints/check-duplicates', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // 4. Create Complaint
  async createComplaint(data: CreateComplaintRequest): Promise<ComplaintRecord> {
    return this.request<ComplaintRecord>('/complaints', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // 5. Get User Complaints
  async getUserComplaints(): Promise<ComplaintRecord[]> {
    return this.request<ComplaintRecord[]>('/complaints');
  }

  // 6. Get Complaint By ID
  async getComplaint(id: string): Promise<ComplaintRecord> {
    return this.request<ComplaintRecord>(`/complaints/${id}`);
  }

  // 7. Submit Feedback / Dispute
  async submitFeedback(
    complaintId: string,
    data: SubmitFeedbackRequest
  ): Promise<ResolutionFeedbackRecord> {
    return this.request<ResolutionFeedbackRecord>(`/complaints/${complaintId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // 8. Analytics
  async getResolutionAnalytics(): Promise<ResolutionAnalytics> {
    return this.request<ResolutionAnalytics>('/analytics/resolution');
  }
}

export const api = new ApiClient();

