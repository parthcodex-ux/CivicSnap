import React, { useRef, useState } from 'react';
import { Camera, Upload, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface Step1Props {
  onPhotoSelected: (file: File, previewUrl: string, userNote: string) => void;
  lang: 'en' | 'hi';
}

export const Step1PhotoCapture: React.FC<Step1Props> = ({ onPhotoSelected, lang }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userNote, setUserNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError(lang === 'en' ? 'Photo size exceeds 10MB limit.' : 'फोटो का आकार 10MB से अधिक नहीं होना चाहिए।');
      return;
    }

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError(lang === 'en' ? 'Only JPG, PNG, and WebP images are supported.' : 'केवल JPG, PNG और WebP प्रारूप समर्थित हैं।');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProceed = () => {
    if (!selectedFile || !preview) {
      setError(lang === 'en' ? 'Please upload or capture a photo first.' : 'कृपया पहले एक फोटो लें या अपलोड करें।');
      return;
    }
    onPhotoSelected(selectedFile, preview, userNote);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sky-100 text-sky-700 mb-3">
          <Camera className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {lang === 'en' ? 'Capture or Upload Civic Issue' : 'नागरिक समस्या की फोटो लें या अपलोड करें'}
        </h2>
        <p className="text-slate-600 text-sm mt-1">
          {lang === 'en'
            ? 'Snap a clear photo of the pothole, garbage, water leak, or streetlight. Gemma 4 will analyze it automatically.'
            : 'गड्ढे, कचरे, पानी के रिसाव या खराब लाइट की स्पष्ट फोटो लें। Gemma 4 स्वतः इसका विश्लेषण करेगा।'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Box / Preview */}
      <div className="mb-6">
        {preview ? (
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex flex-col items-center">
            <img
              src={preview}
              alt="Civic issue preview"
              className="max-h-80 w-auto object-contain"
            />
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md rounded-lg p-2 shadow-sm flex items-center space-x-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'en' ? 'Photo Validated' : 'फोटो स्वीकृत'}</span>
            </div>
            <div className="p-3 w-full bg-slate-900/80 backdrop-blur text-center flex justify-center space-x-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium underline"
              >
                {lang === 'en' ? 'Change Photo' : 'फोटो बदलें'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 rounded-2xl flex flex-col items-center justify-center transition group text-center cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-sky-100 group-hover:bg-sky-200 flex items-center justify-center text-sky-700 mb-3 transition">
                <Camera className="w-7 h-7" />
              </div>
              <span className="font-semibold text-slate-800 text-sm">
                {lang === 'en' ? 'Take Live Photo' : 'कैमरे से फोटो लें'}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                {lang === 'en' ? 'Using smartphone camera' : 'स्मार्टफोन कैमरा का उपयोग करें'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 rounded-2xl flex flex-col items-center justify-center transition group text-center cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-slate-200 group-hover:bg-slate-300 flex items-center justify-center text-slate-700 mb-3 transition">
                <Upload className="w-7 h-7" />
              </div>
              <span className="font-semibold text-slate-800 text-sm">
                {lang === 'en' ? 'Upload from Gallery' : 'गैलरी से अपलोड करें'}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                {lang === 'en' ? 'JPG, PNG, WebP up to 10MB' : 'JPG, PNG, WebP (अधिकतम 10MB)'}
              </span>
            </button>
          </div>
        )}

        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Optional Note */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          {lang === 'en' ? 'Optional Context or Landmark' : 'अतिरिक्त विवरण या पहचान चिन्ह (वैकल्पिक)'}
        </label>
        <textarea
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
          placeholder={
            lang === 'en'
              ? 'e.g. Near bus stop, leaking since yesterday morning, water entering shops...'
              : 'उदा. बस स्टॉप के पास, कल सुबह से पानी बह रहा है...'
          }
          rows={2}
          className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Submit / Proceed */}
      <button
        type="button"
        onClick={handleProceed}
        disabled={!selectedFile}
        className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2"
      >
        <Sparkles className="w-5 h-5" />
        <span>{lang === 'en' ? 'Analyze with Gemma 4 Vision' : 'Gemma 4 विज़न से समझें'}</span>
      </button>
    </div>
  );
};
