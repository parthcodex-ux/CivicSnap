import React, { useState } from 'react';
import {
  ComplaintRecord,
  ResolveAuthorityResponse,
  CreateComplaintRequest
} from '@civicsnap/shared';
import {
  CheckCircle2,
  Send,
  Copy,
  ExternalLink,
  ShieldCheck,
  FileText,
  Building,
  MapPin,
  Clock
} from 'lucide-react';
import { api } from '../../services/api';

interface Step5Props {
  complaintData: {
    category: any;
    severity: any;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    address: string;
    photoPreview: string;
    userConsent: boolean;
  };
  authorityResolution: ResolveAuthorityResponse;
  lang: 'en' | 'hi';
  onSubmitted: (complaint: ComplaintRecord) => void;
  onBack: () => void;
}

export const Step5ReviewSubmit: React.FC<Step5Props> = ({
  complaintData,
  authorityResolution,
  lang,
  onSubmitted,
  onBack
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<ComplaintRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = authorityResolution.authority;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreateComplaintRequest = {
        category: complaintData.category,
        title: complaintData.title,
        description: complaintData.description,
        language: lang,
        severity: complaintData.severity,
        latitude: complaintData.latitude,
        longitude: complaintData.longitude,
        address: complaintData.address,
        authorityId: auth.id,
        photoStoragePath: complaintData.photoPreview,
        evidenceQualityRating: 'ACCEPTABLE',
        userConsentGranted: complaintData.userConsent,
        isAssistedDraft: authorityResolution.submissionMode === 'ASSISTED_PORTAL'
      };

      const record = await api.createComplaint(payload);
      setSubmissionResult(record);
      onSubmitted(record);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setError(err.message || 'Failed to submit complaint. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyDossier = () => {
    const text = `[CIVIC GRIEVANCE]
Authority: ${auth.name}
Category: ${complaintData.category}
Location: ${complaintData.address} [${complaintData.latitude}, ${complaintData.longitude}]
Subject: ${complaintData.title}

${complaintData.description}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (submissionResult) {
    const isDirect = submissionResult.submissionMode === 'DIRECT_API';

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 max-w-2xl mx-auto space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-2">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900">
          {isDirect
            ? (lang === 'en' ? 'Grievance Successfully Lodged!' : 'शिकायत सफलतापूर्वक दर्ज हो गई!')
            : (lang === 'en' ? 'Civic Dossier Prepared & Saved!' : 'नागरिक शिकायत पत्र तैयार व सुरक्षित!')}
        </h2>

        <p className="text-sm text-slate-600">
          {isDirect
            ? (lang === 'en'
                ? 'Your report has been received by the municipal authority API and is queued for action.'
                : 'आपकी शिकायत नगर निगम के अधिकृत सर्वर पर दर्ज कर दी गई है।')
            : (lang === 'en'
                ? 'Your grievance has been stored securely in CivicSnap. Follow the assisted portal guidance below.'
                : 'आपकी शिकायत CivicSnap में सुरक्षित कर ली गई है। आधिकारिक पोर्टल पर दर्ज करने हेतु नीचे दिए गए निर्देशों का पालन करें।')}
        </p>

        {/* Receipt Box */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Internal Tracking ID:</span>
            <span className="font-mono font-bold text-slate-900">{submissionResult.id}</span>
          </div>

          {submissionResult.officialReferenceId && (
            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
              <span className="text-emerald-700 font-semibold">Official Authority Receipt:</span>
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                {submissionResult.officialReferenceId}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
            <span className="text-slate-500">Destination Authority:</span>
            <span className="font-semibold text-slate-800">{auth.name}</span>
          </div>
        </div>

        {/* Assisted Portal Actions if applicable */}
        {!isDirect && auth.portalUrl && (
          <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-left space-y-3">
            <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center space-x-1.5">
              <ExternalLink className="w-4 h-4 text-sky-600" />
              <span>Assisted Official Submission</span>
            </h4>
            <p className="text-xs text-sky-800 leading-relaxed">
              Copy your prepared complaint dossier and submit it directly to the verified municipal portal:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={copyDossier}
                className="py-2.5 px-4 rounded-lg bg-white border border-sky-300 hover:bg-sky-50 text-sky-800 text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Complaint Dossier'}</span>
              </button>

              <a
                href={auth.portalUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <span>Open {auth.name} Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        <div className="pt-2">
          <p className="text-xs text-slate-500">
            You can track genuine status updates, upload resolution verification, or dispute unresolved actions in the
            <strong> My Complaints</strong> dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sky-100 text-sky-700 mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {lang === 'en' ? 'Final Review & Dispatch' : 'शिकायत की अंतिम समीक्षा एवं प्रेषण'}
        </h2>
        <p className="text-slate-600 text-sm mt-1">
          {lang === 'en'
            ? 'Review the verified grievance dossier before official transmission.'
            : 'प्रेषित करने से पहले तैयार की गई जानकारी की समीक्षा करें।'}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Summary Card */}
      <div className="space-y-4 text-xs text-slate-700">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900 text-sm">{complaintData.title}</span>
          </div>

          <p className="text-slate-600 whitespace-pre-line text-xs">
            {complaintData.description}
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
            <div className="flex items-center space-x-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">{auth.name}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">{complaintData.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
        >
          {lang === 'en' ? 'Back' : 'वापस'}
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-md hover:shadow-lg disabled:opacity-50 transition flex items-center space-x-2 text-sm"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? 'Submitting...' : (lang === 'en' ? 'Submit Official Grievance' : 'शिकायत दर्ज करें')}</span>
        </button>
      </div>
    </div>
  );
};

