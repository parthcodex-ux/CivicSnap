import React, { useState, useEffect } from 'react';
import { ComplaintRecord, ComplaintStatus } from '@civicsnap/shared';
import {
  ClipboardList,
  Clock,
  Building,
  MapPin,
  ChevronRight,
  Plus,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { ComplaintDetailModal } from './ComplaintDetailModal';

interface ComplaintListProps {
  lang: 'en' | 'hi';
  onNewReport: () => void;
}

export const ComplaintList: React.FC<ComplaintListProps> = ({ lang, onNewReport }) => {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | ComplaintStatus>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeComplaint, setActiveComplaint] = useState<ComplaintRecord | null>(null);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUserComplaints();
      setComplaints(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const filtered = complaints.filter((c) => {
    if (selectedFilter === 'ALL') return true;
    return c.status === selectedFilter;
  });

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {lang === 'en' ? 'My Civic Complaints' : 'मेरी दर्ज शिकायतें'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'en'
              ? 'Track official progress, verified SLA resolution, and citizen ground feedback.'
              : 'प्रशासनिक कार्रवाई, समय-सीमा एवं समाधान की स्थिति ट्रैक करें।'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchComplaints}
            className="p-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
            title="Refresh Complaints"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onNewReport}
            className="px-4 py-2.5 rounded-xl font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow flex items-center space-x-1.5 text-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'en' ? 'Report New Issue' : 'नई शिकायत दर्ज करें'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 text-xs font-semibold">
        {['ALL', 'SUBMITTED', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'DISPUTED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedFilter(tab as any)}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
              selectedFilter === tab
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="p-12 text-center text-slate-500 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
          <span>Loading complaints...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {lang === 'en' ? 'No Complaints Found' : 'कोई शिकायत नहीं मिली'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'en'
                ? 'You have not submitted any complaints matching this filter yet.'
                : 'इस श्रेणी में आपकी कोई शिकायत दर्ज नहीं है।'}
            </p>
          </div>
          <button
            onClick={onNewReport}
            className="px-5 py-2.5 rounded-xl font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow text-xs inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'en' ? 'Report a Civic Issue' : 'समस्या दर्ज करें'}</span>
          </button>
        </div>
      )}

      {/* List of Complaint Cards */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveComplaint(c)}
              className="bg-white rounded-2xl border border-slate-200 hover:border-sky-300 p-5 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(c.status)}`}>
                    {c.status}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {c.category}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    · {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600">
                  {c.title}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.authorityName || c.authorityId}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate max-w-xs">{c.address}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center">
                {c.officialReferenceId && (
                  <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    {c.officialReferenceId}
                  </span>
                )}
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {activeComplaint && (
        <ComplaintDetailModal
          complaint={activeComplaint}
          lang={lang}
          onClose={() => setActiveComplaint(null)}
          onRefresh={fetchComplaints}
        />
      )}
    </div>
  );
};
