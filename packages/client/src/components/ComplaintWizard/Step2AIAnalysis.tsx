import React, { useState } from 'react';
import {
  AIAnalysisResult,
  IssueCategory,
  SeverityLevel
} from '@civicsnap/shared';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Edit3,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface Step2Props {
  analysis: AIAnalysisResult;
  photoUrl: string;
  lang: 'en' | 'hi';
  onConfirmed: (editedDraft: {
    category: IssueCategory;
    severity: SeverityLevel;
    title: string;
    description: string;
  }) => void;
  onBack: () => void;
}

export const Step2AIAnalysis: React.FC<Step2Props> = ({
  analysis,
  photoUrl,
  lang,
  onConfirmed,
  onBack
}) => {
  const [draftLang, setDraftLang] = useState<'en' | 'hi'>(lang);
  const [category, setCategory] = useState<IssueCategory>(analysis.issueCategory);
  const [severity, setSeverity] = useState<SeverityLevel>(analysis.severity);
  const [title, setTitle] = useState(analysis.proposedDraft.title);
  const [description, setDescription] = useState(
    draftLang === 'en' ? analysis.proposedDraft.bodyEn : analysis.proposedDraft.bodyHi
  );
  const [isEditing, setIsEditing] = useState(false);

  const switchLanguage = (newLang: 'en' | 'hi') => {
    setDraftLang(newLang);
    setDescription(newLang === 'en' ? analysis.proposedDraft.bodyEn : analysis.proposedDraft.bodyHi);
  };

  const getSeverityBadge = (s: SeverityLevel) => {
    switch (s) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'LOW':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  const handleNext = () => {
    onConfirmed({
      category,
      severity,
      title,
      description
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Gemma 4 Multimodal Vision</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Confidence: {Math.round(analysis.confidenceScore * 100)}% ({analysis.confidenceLabel})
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            {lang === 'en' ? 'AI Assessment & Proposed Draft' : 'AI द्वारा समस्या का विश्लेषण व प्रारूप'}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getSeverityBadge(severity)}`}>
            {severity} Severity
          </span>
        </div>
      </div>

      {/* Photo + Evidence Assessment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-44 md:h-auto flex items-center justify-center">
          <img src={photoUrl} alt="Issue" className="w-full h-full object-cover" />
          <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur rounded-lg px-2.5 py-1 text-[11px] text-white">
            Quality: <strong className="text-sky-300">{analysis.evidenceQuality.rating}</strong>
          </div>
        </div>

        <div className="md:col-span-2 space-y-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {lang === 'en' ? 'Visual Observations' : 'पहचाने गए तथ्य'}
            </h4>
            <p className="text-sm text-slate-800 font-medium leading-relaxed">
              {analysis.conciseDescription}
            </p>
            <div className="mt-2 text-xs text-slate-600">
              <strong>Impact: </strong>{analysis.severityExplanation}
            </div>
          </div>

          {/* Evidence Quality Advisory */}
          {(!analysis.evidenceQuality.issueClearlyVisible || analysis.evidenceQuality.isBlurry) && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start space-x-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Evidence Quality Advisory: </strong>
                {analysis.evidenceQuality.recommendations.join('. ')}
              </div>
            </div>
          )}

          {/* Missing info checklist */}
          {analysis.missingInformation.length > 0 && (
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900">
              <div className="font-semibold flex items-center space-x-1.5 mb-1 text-sky-800">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Please Confirm with Authorities' : 'कृपया इसकी पुष्टि करें'}</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                {analysis.missingInformation.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Editable Civic Draft */}
      <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-900">
              {lang === 'en' ? 'Review & Edit Complaint Draft' : 'शिकायत पत्र की समीक्षा करें'}
            </h3>
            <span className="text-xs text-slate-400">| You have final control</span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => switchLanguage('en')}
                className={`px-2.5 py-1 rounded-md transition ${draftLang === 'en' ? 'bg-white shadow text-sky-700 font-bold' : 'text-slate-600'}`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => switchLanguage('hi')}
                className={`px-2.5 py-1 rounded-md transition ${draftLang === 'hi' ? 'bg-white shadow text-sky-700 font-bold' : 'text-slate-600'}`}
              >
                हिंदी
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-sky-600 hover:text-sky-700 flex items-center space-x-1 font-semibold ml-2"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Preview' : 'Edit Text'}</span>
            </button>
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            ) : (
              <div className="text-sm font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {title}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Formal Letter Body</label>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            ) : (
              <div className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-line leading-relaxed">
                {description}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 p-2.5 bg-slate-50 rounded-lg flex items-center space-x-2 text-xs text-slate-600">
          <ShieldAlert className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>AI output is a suggested proposal. You verify the facts before any official dispatch.</span>
        </div>
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
          className="px-6 py-2.5 rounded-xl font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow transition flex items-center space-x-2 text-sm"
        >
          <span>{lang === 'en' ? 'Confirm & Pick Location' : 'स्थान की पुष्टि करें'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
