import React, { useState, useEffect } from 'react';
import { ResolutionAnalytics } from '@civicsnap/shared';
import {
  BarChart3,
  Clock,
  ThumbsUp,
  AlertOctagon,
  CheckCircle2,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';

interface StatsProps {
  lang: 'en' | 'hi';
}

export const ResolutionStats: React.FC<StatsProps> = ({ lang }) => {
  const [stats, setStats] = useState<ResolutionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getResolutionAnalytics();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
        <span>Loading municipal accountability metrics...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm text-center">
        {error || 'No analytics data available'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {lang === 'en' ? 'Civic Accountability & Resolution Metrics' : 'नागरिक जवाबदेही एवं समाधान सूचकांक'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'en'
              ? 'Transparent municipal performance tracking powered by verified citizen feedback.'
              : 'नागरिकों द्वारा जमीनी स्तर पर सत्यापित निष्पक्ष एवं पारदर्शी आंकड़े।'}
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="p-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Filed
          </span>
          <div className="text-2xl font-bold text-slate-900">{stats.totalComplaints}</div>
          <span className="text-[11px] text-slate-400">Civic complaints</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Verified Resolved
          </span>
          <div className="text-2xl font-bold text-emerald-700">{stats.resolvedCount}</div>
          <span className="text-[11px] text-emerald-600/80">Citizen confirmed</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            Average SLA
          </span>
          <div className="text-2xl font-bold text-slate-900">
            {stats.averageResolutionHours ? `${stats.averageResolutionHours}h` : 'N/A'}
          </div>
          <span className="text-[11px] text-slate-400">Response time</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
            Citizen Satisfaction
          </span>
          <div className="text-2xl font-bold text-indigo-700">
            {stats.citizenSatisfactionAverage ? `${stats.citizenSatisfactionAverage} / 5` : 'N/A'}
          </div>
          <span className="text-[11px] text-slate-400">Average rating</span>
        </div>
      </div>

      {/* Disputes & Transparency Note */}
      <div className="p-5 bg-gradient-to-br from-slate-50 to-amber-50/50 rounded-2xl border border-slate-200 space-y-2">
        <div className="flex items-center space-x-2">
          <AlertOctagon className="w-5 h-5 text-rose-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Disputed Resolutions: <span className="text-rose-600">{stats.disputedCount}</span>
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          CivicSnap enforces citizen verification: authorities cannot simply mark an issue resolved without citizen confirmation. If a citizen disputes a claimed resolution, it triggers an audit escalation.
        </p>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Grievances by Category
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {Object.entries(stats.categoryBreakdown).map(([cat, count]) => (
            <div key={cat} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <span className="font-medium text-slate-700 truncate pr-2">
                {cat.replace('_', ' ')}
              </span>
              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded shadow-xs">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
