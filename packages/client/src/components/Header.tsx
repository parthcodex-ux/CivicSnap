import React from 'react';
import { Camera, ClipboardList, BarChart3, Globe } from 'lucide-react';

interface HeaderProps {
  activeTab: 'report' | 'dashboard' | 'analytics';
  onSelectTab: (tab: 'report' | 'dashboard' | 'analytics') => void;
  lang: 'en' | 'hi';
  onToggleLang: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  lang,
  onToggleLang
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => onSelectTab('report')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl tracking-tight text-slate-900">
                Civic<span className="text-sky-600">Snap</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-sky-100 text-sky-800 rounded-full uppercase">
                Gemma 4
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              {lang === 'en' ? 'Verified Civic Grievance & Accountability' : 'सत्यापित नागरिक शिकायत एवं जवाबदेही'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => onSelectTab('report')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'report'
                ? 'bg-sky-50 text-sky-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span className="hidden md:inline">{lang === 'en' ? 'Report Issue' : 'शिकायत दर्ज करें'}</span>
          </button>

          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'dashboard'
                ? 'bg-sky-50 text-sky-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span className="hidden md:inline">{lang === 'en' ? 'My Complaints' : 'मेरी शिकायतें'}</span>
          </button>

          <button
            onClick={() => onSelectTab('analytics')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'analytics'
                ? 'bg-sky-50 text-sky-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden md:inline">{lang === 'en' ? 'Accountability' : 'पारदर्शिता'}</span>
          </button>

          {/* Bilingual Toggle */}
          <button
            onClick={onToggleLang}
            className="flex items-center space-x-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition ml-2"
            title="Toggle Language (English / हिंदी)"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{lang === 'en' ? 'HI' : 'EN'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

