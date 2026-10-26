import React, { useState } from 'react';
import { ComplaintRecord } from '@civicsnap/shared';
import {
  X,
  Clock,
  Building,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  History,
  FileCheck2,
  ExternalLink
} from 'lucide-react';
import { ResolutionModal } from './ResolutionModal';

interface DetailModalProps {
  complaint: ComplaintRecord;
  lang: 'en' | 'hi';
  onClose: () => void;
  onRefresh: () => void;
}

export const ComplaintDetailModal: React.FC<DetailModalProps> = ({
  complaint,
  lang,
  onClose,
  onRefresh
}) => {
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'DISPUTED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'IN_REVIEW':
      case 'IN_PROGRESS':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'SUBMITTED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(complaint.status)}`}>
              {complaint.status}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ID: {complaint.id}
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mt-2">
            {complaint.title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Reported on {new Date(complaint.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-4">
          <div>
            <span className="text-slate-500 block">Authority / Department:</span>
            <span className="font-semibold text-slate-900">{complaint.authorityName || complaint.authorityId}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Submission Channel:</span>
            <span className="font-semibold text-slate-900">{complaint.submissionMode}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-slate-500 block">Location:</span>
            <span className="font-semibold text-slate-900">{complaint.address}</span>
          </div>
          {complaint.officialReferenceId && (
            <div className="sm:col-span-2 pt-1 border-t border-slate-200 flex justify-between items-center">
              <span className="text-emerald-700 font-semibold">Official Receipt Reference:</span>
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {complaint.officialReferenceId}
              </span>
            </div>
          )}
        </div>

        {/* Full description */}
        <div className="mb-5">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Grievance Text
          </h4>
          <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-line">
            {complaint.description}
          </p>
        </div>

        {/* Audit Status Timeline */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <History className="w-4 h-4 text-slate-500" />
            <span>Official Status & Audit Timeline</span>
          </h4>

          <div className="relative pl-6 border-l-2 border-sky-200 space-y-4 ml-2">
            {complaint.history && complaint.history.length > 0 ? (
              complaint.history.map((h) => (
                <div key={h.id} className="relative text-xs">
                  <div className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-sky-500 ring-4 ring-sky-100" />
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{h.toStatus}</span>
                    <span className="text-[10px] text-slate-400">by {h.changedByRole}</span>
                    <span className="text-[10px] text-slate-400">· {new Date(h.createdAt).toLocaleTimeString()}</span>
                  </div>
                  {h.reasonOrNote && (
                    <p className="text-slate-600 mt-0.5 leading-relaxed">{h.reasonOrNote}</p>
                  )}
                  {h.officialReference && (
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1 rounded">
                      Ref: {h.officialReference}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No status updates recorded yet.</p>
            )}
          </div>
        </div>

        {/* Citizen Verification & Dispute Action */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => setShowVerifyModal(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 shadow flex items-center space-x-1.5"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Verify Resolution / File Dispute</span>
          </button>
        </div>

        {showVerifyModal && (
          <ResolutionModal
            complaint={complaint}
            lang={lang}
            onClose={() => setShowVerifyModal(false)}
            onSuccess={() => {
              setShowVerifyModal(false);
              onRefresh();
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
};
