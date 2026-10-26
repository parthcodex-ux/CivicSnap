import React, { useState } from 'react';
import {
  ComplaintRecord,
  ResolutionCitizenStatus,
  SubmitFeedbackRequest
} from '@civicsnap/shared';
import {
  X,
  Star,
  ShieldCheck,
  AlertOctagon,
  CheckCircle,
  Upload,
  Camera
} from 'lucide-react';
import { api } from '../../services/api';

interface ResolutionModalProps {
  complaint: ComplaintRecord;
  lang: 'en' | 'hi';
  onClose: () => void;
  onSuccess: () => void;
}

export const ResolutionModal: React.FC<ResolutionModalProps> = ({
  complaint,
  lang,
  onClose,
  onSuccess
}) => {
  const [status, setStatus] = useState<ResolutionCitizenStatus>('FULLY_RESOLVED');
  const [rating, setRating] = useState<number>(5);
  const [comments, setComments] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: SubmitFeedbackRequest = {
        citizenResolutionStatus: status,
        satisfactionRating: rating,
        comments: comments || undefined,
        disputeReason: status === 'STILL_UNRESOLVED' ? disputeReason : undefined
      };

      await api.submitFeedback(complaint.id, payload);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 uppercase tracking-wider">
            Citizen Accountability Verification
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">
            {lang === 'en' ? 'Verify Ground Resolution' : 'समस्या समाधान की पुष्टि करें'}
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Complaint: <span className="font-semibold text-slate-800">{complaint.title}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Resolution Status Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              On-Ground Condition:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('FULLY_RESOLVED')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition ${
                  status === 'FULLY_RESOLVED'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-400'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Fully Resolved</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('PARTIALLY_RESOLVED')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition ${
                  status === 'PARTIALLY_RESOLVED'
                    ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-400'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Partially Resolved</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('STILL_UNRESOLVED')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition ${
                  status === 'STILL_UNRESOLVED'
                    ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-400'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>Dispute / Not Fixed</span>
              </button>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Department Satisfaction Rating (1-5):
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none transition"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-slate-700 ml-2">
                {rating} / 5 Stars
              </span>
            </div>
          </div>

          {/* Dispute Reason if Unresolved */}
          {status === 'STILL_UNRESOLVED' && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
              <label className="block text-xs font-bold text-rose-900 mb-1">
                Dispute Reason (Why is it still unresolved?)
              </label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="e.g. Debris was moved but pothole remains unpatched; water leakage started again..."
                rows={2}
                required
                className="w-full text-xs rounded-lg border border-rose-300 p-2 text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
              />
            </div>
          )}

          {/* Comments */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Citizen Comments & Feedback
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Provide comments regarding field team response or work quality..."
              rows={2}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (status === 'STILL_UNRESOLVED' && !disputeReason)}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 transition shadow"
            >
              {isSubmitting ? 'Recording Verification...' : 'Submit Ground Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

