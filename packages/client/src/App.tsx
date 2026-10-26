import React, { useState } from 'react';
import {
  AIAnalysisResult,
  ComplaintRecord,
  DuplicateCheckResponse,
  IssueCategory,
  ResolveAuthorityResponse,
  SeverityLevel
} from '@civicsnap/shared';
import { Header } from './components/Header';
import { Step1PhotoCapture } from './components/ComplaintWizard/Step1PhotoCapture';
import { Step2AIAnalysis } from './components/ComplaintWizard/Step2AIAnalysis';
import { Step3Location } from './components/ComplaintWizard/Step3Location';
import { Step4AuthorityDuplicate } from './components/ComplaintWizard/Step4AuthorityDuplicate';
import { Step5ReviewSubmit } from './components/ComplaintWizard/Step5ReviewSubmit';
import { ComplaintList } from './components/Dashboard/ComplaintList';
import { ResolutionStats } from './components/Analytics/ResolutionStats';
import { api } from './services/api';
import { Sparkles, Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'report' | 'dashboard' | 'analytics'>('report');
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  // Wizard state
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [userNote, setUserNote] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);

  // Confirmed draft values
  const [category, setCategory] = useState<IssueCategory>('POTHOLE');
  const [severity, setSeverity] = useState<SeverityLevel>('HIGH');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Location
  const [latitude, setLatitude] = useState(28.6139);
  const [longitude, setLongitude] = useState(77.2090);
  const [address, setAddress] = useState('Central Secretariat, New Delhi 110001');

  // Authority & duplicate check
  const [authorityResolution, setAuthorityResolution] = useState<ResolveAuthorityResponse | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateCheckResponse | null>(null);
  const [userConsent, setUserConsent] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Step 1: Photo selected -> Trigger AI analysis
  const handlePhotoSelected = async (file: File, preview: string, note: string) => {
    setPhotoFile(file);
    setPhotoPreview(preview);
    setUserNote(note);
    setIsAnalyzing(true);

    try {
      const result = await api.analyzeImage(file, note, lang, latitude, longitude);
      setAiAnalysis(result);
      setCategory(result.issueCategory);
      setSeverity(result.severity);
      setTitle(result.proposedDraft.title);
      setDescription(lang === 'en' ? result.proposedDraft.bodyEn : result.proposedDraft.bodyHi);
      setWizardStep(2);
    } catch (err: any) {
      console.error('AI analysis error:', err);
      alert(err.message || 'Could not analyze photo. Please verify connection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2: AI draft confirmed
  const handleDraftConfirmed = (draft: {
    category: IssueCategory;
    severity: SeverityLevel;
    title: string;
    description: string;
  }) => {
    setCategory(draft.category);
    setSeverity(draft.severity);
    setTitle(draft.title);
    setDescription(draft.description);
    setWizardStep(3);
  };

  // Step 3: Location confirmed -> resolve authority and check duplicates
  const handleLocationConfirmed = async (loc: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setAddress(loc.address);
    setIsLoadingAuth(true);

    try {
      const [authRes, dupRes] = await Promise.all([
        api.resolveAuthority({
          category,
          latitude: loc.latitude,
          longitude: loc.longitude,
          addressText: loc.address
        }),
        api.checkDuplicates({
          category,
          latitude: loc.latitude,
          longitude: loc.longitude
        })
      ]);

      setAuthorityResolution(authRes);
      setDuplicateInfo(dupRes);
      setWizardStep(4);
    } catch (err: any) {
      console.error('Resolution error:', err);
      alert(err.message || 'Failed to resolve authority.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Step 4: Authority & consent confirmed
  const handleAuthorityConfirmed = (consent: boolean) => {
    setUserConsent(consent);
    setWizardStep(5);
  };

  const resetWizard = () => {
    setWizardStep(1);
    setPhotoFile(null);
    setPhotoPreview('');
    setUserNote('');
    setAiAnalysis(null);
    setAuthorityResolution(null);
    setDuplicateInfo(null);
    setUserConsent(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'hi' : 'en')}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* REPORT TAB */}
        {activeTab === 'report' && (
          <div className="space-y-6">
            {/* Wizard Step Indicator */}
            <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-4 text-xs font-semibold">
              {[
                { step: 1, label: lang === 'en' ? 'Photo' : 'फोटो' },
                { step: 2, label: lang === 'en' ? 'Gemma 4 AI' : 'AI प्रारूप' },
                { step: 3, label: lang === 'en' ? 'Location' : 'स्थान' },
                { step: 4, label: lang === 'en' ? 'Authority' : 'विभाग' },
                { step: 5, label: lang === 'en' ? 'Submit' : 'प्रेषण' }
              ].map((s) => (
                <div key={s.step} className="flex items-center space-x-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition ${
                      wizardStep === s.step
                        ? 'bg-sky-600 text-white shadow'
                        : wizardStep > s.step
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {wizardStep > s.step ? '✓' : s.step}
                  </div>
                  <span className={`hidden sm:inline ${wizardStep === s.step ? 'text-sky-700 font-bold' : 'text-slate-500'}`}>
                    {s.label}
                  </span>
                  {s.step < 5 && <span className="text-slate-300 ml-1">/</span>}
                </div>
              ))}
            </div>

            {/* Loading AI spinner */}
            {isAnalyzing && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto text-sky-600 animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {lang === 'en' ? 'Gemma 4 Multimodal Vision Inference' : 'Gemma 4 फोटो का विश्लेषण कर रहा है'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {lang === 'en'
                    ? 'Identifying issue category, evaluating evidence quality, assessing severity, and drafting formal grievance...'
                    : 'समस्या की पहचान, फोटो गुणवत्ता और औपचारिक शिकायत पत्र तैयार किया जा रहा है...'}
                </p>
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-sky-600" />
              </div>
            )}

            {/* Resolving Authority spinner */}
            {isLoadingAuth && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  Resolving Municipal Jurisdiction...
                </h3>
                <p className="text-xs text-slate-500">
                  Matching coordinates against verified department boundaries and checking nearby duplicate reports.
                </p>
              </div>
            )}

            {/* Active Wizard Step Component */}
            {!isAnalyzing && !isLoadingAuth && (
              <>
                {wizardStep === 1 && (
                  <Step1PhotoCapture
                    onPhotoSelected={handlePhotoSelected}
                    lang={lang}
                  />
                )}

                {wizardStep === 2 && aiAnalysis && (
                  <Step2AIAnalysis
                    analysis={aiAnalysis}
                    photoUrl={photoPreview}
                    lang={lang}
                    onConfirmed={handleDraftConfirmed}
                    onBack={() => setWizardStep(1)}
                  />
                )}

                {wizardStep === 3 && (
                  <Step3Location
                    initialLat={latitude}
                    initialLng={longitude}
                    initialAddress={address}
                    lang={lang}
                    onLocationConfirmed={handleLocationConfirmed}
                    onBack={() => setWizardStep(2)}
                  />
                )}

                {wizardStep === 4 && authorityResolution && duplicateInfo && (
                  <Step4AuthorityDuplicate
                    authorityResolution={authorityResolution}
                    duplicateInfo={duplicateInfo}
                    lang={lang}
                    onConfirmed={handleAuthorityConfirmed}
                    onBack={() => setWizardStep(3)}
                  />
                )}

                {wizardStep === 5 && authorityResolution && (
                  <Step5ReviewSubmit
                    complaintData={{
                      category,
                      severity,
                      title,
                      description,
                      latitude,
                      longitude,
                      address,
                      photoPreview,
                      userConsent
                    }}
                    authorityResolution={authorityResolution}
                    lang={lang}
                    onSubmitted={() => {}}
                    onBack={() => setWizardStep(4)}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <ComplaintList
            lang={lang}
            onNewReport={() => {
              resetWizard();
              setActiveTab('report');
            }}
          />
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <ResolutionStats lang={lang} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>CivicSnap Platform — Powered by Google Gemma 4 & Supabase</p>
        <p className="mt-1 text-slate-400">Strict RLS isolation · Transparent authority resolution · Genuine status tracking</p>
      </footer>
    </div>
  );
};

