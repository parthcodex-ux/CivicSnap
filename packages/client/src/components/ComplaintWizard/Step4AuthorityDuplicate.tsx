import React, { useState } from 'react';
import {
  ResolveAuthorityResponse,
  DuplicateCheckResponse
} from '@civicsnap/shared';
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
  Clock
} from 'lucide-react';

interface Step4Props {
  authorityResolution: ResolveAuthorityResponse;
  duplicateInfo: DuplicateCheckResponse;
  lang: 'en' | 'hi';
  onConfirmed: (consentGranted: boolean) => void;
  onBack: () => void;
}

export const Step4AuthorityDuplicate: React.FC<Step4Props> = ({
  authorityResolution,
  duplicateInfo,
  lang,
  onConfirmed,
  onBack
}) => {
  const [consent, setConsent] = useState(true);
  const auth = authorityResolution.authority;

  const handleNext = () => {
    if (!consent) {
      alert('Explicit consent is required to submit your civic complaint.');
      return;
    }
    onConfirmed(consent);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {lang === 'en' ? 'Jurisdiction & Authority Matching' : 'संबंधित विभाग एवं अधिकार क्षेत्र'}
        </h2>
        <p className="text-slate-600 text-sm mt-1">
          {lang === 'en'
            ? 'CivicSnap automatically identifies the correct government department responsible for your issue.'
            : 'CivicSnap समस्या के आधार पर उत्तरदायी सरकारी विभाग की पहचान करता है।'}
        </p>
      </div>

      {/* Duplicate Alert if detected */}
      {duplicateInfo.hasDuplicates && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
          <div className="flex items-center space-x-2 text-sm font-bold text-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>
              {lang === 'en'
                ? 'Nearby Duplicate Issue Detected!'
                : 'समीप में पहले से दर्ज समस्या पाई गई!'}
            </span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            {duplicateInfo.message}
          </p>
          <div className="pt-2 border-t border-amber-200/60">
            {duplicateInfo.duplicates.map((dup) => (
              <div key={dup.complaintId} className="flex items-center justify-between text-xs py-1">
                <span className="font-medium text-slate-800">{dup.title}</span>
                <span className="text-amber-700 font-semibold">{dup.distanceMeters}m away ({dup.status})</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-amber-700 italic">
            {lang === 'en'
              ? 'You may still file your report to add further photographic evidence and escalate priority.'
              : 'आप अतिरिक्त प्रमाण और प्राथमिकता बढ़ाने के लिए अपनी शिकायत फिर भी दर्ज कर सकते हैं।'}
          </p>
        </div>
      )}

      {/* Authority Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-200 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
              Responsible Authority
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              {auth.name}
            </h3>
            <p className="text-xs font-semibold text-slate-600">
              {auth.department}
            </p>
          </div>

          <div className="flex flex-col items-end">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              authorityResolution.submissionMode === 'DIRECT_API'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-blue-100 text-blue-800 border border-blue-300'
            }`}>
              {authorityResolution.submissionMode === 'DIRECT_API' ? 'Direct API Gateway' : 'Assisted Official Portal'}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>SLA: {auth.slaHours} hours</span>
            </span>
          </div>
        </div>

        {/* Transparent Matching Rationale */}
        <div className="p-3 bg-white/80 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
          <strong className="text-slate-900">Why this authority: </strong>
          {authorityResolution.matchingExplanation}
        </div>

        {auth.portalUrl && (
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500">Official Portal:</span>
            <a
              href={auth.portalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sky-600 hover:text-sky-700 font-semibold flex items-center space-x-1"
            >
              <span>{new URL(auth.portalUrl).hostname}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Explicit Citizen Consent */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
          />
          <div className="text-xs text-slate-700 space-y-1">
            <div className="font-semibold text-slate-900 flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Explicit Citizen Submission Consent</span>
            </div>
            <p className="leading-relaxed">
              {lang === 'en'
                ? 'I verify that the photo and details represent a genuine civic issue observed by me. I authorize CivicSnap to transmit this grievance dossier to the resolved municipal authority.'
                : 'मैं प्रमाणित करता/करती हूँ कि यह फोटो और विवरण मेरे द्वारा देखी गई वास्तविक समस्या है। मैं CivicSnap को इसे संबंधित नगर निगम को प्रेषित करने हेतु अधिकृत करता/करती हूँ।'}
            </p>
          </div>
        </label>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
        >
          {lang === 'en' ? 'Back' : 'वापस'}
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!consent}
          className="px-6 py-2.5 rounded-xl font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 shadow transition flex items-center space-x-2 text-sm"
        >
          <span>{lang === 'en' ? 'Review & Submit Grievance' : 'समीक्षा एवं शिकायत दर्ज करें'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

