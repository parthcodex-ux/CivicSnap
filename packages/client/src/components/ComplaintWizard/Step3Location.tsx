import React, { useState } from 'react';
import { MapPin, Navigation, CheckCircle2, ArrowRight } from 'lucide-react';

interface Step3Props {
  initialLat: number;
  initialLng: number;
  initialAddress: string;
  lang: 'en' | 'hi';
  onLocationConfirmed: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  onBack: () => void;
}

export const Step3Location: React.FC<Step3Props> = ({
  initialLat,
  initialLng,
  initialAddress,
  lang,
  onLocationConfirmed,
  onBack
}) => {
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [address, setAddress] = useState(initialAddress || 'Barakhamba Road, Connaught Place, New Delhi 110001');
  const [isLocating, setIsLocating] = useState(false);
  const [gpsAcquired, setGpsAcquired] = useState(false);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGpsAcquired(true);
        setIsLocating(false);
        setAddress(`GPS Location [${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}]`);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err.message);
        alert('Could not acquire precise GPS location. You can select a test landmark or enter address manually.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const setTestPreset = (presetName: string, pLat: number, pLng: number, pAddr: string) => {
    setLat(pLat);
    setLng(pLng);
    setAddress(pAddr);
    setGpsAcquired(true);
  };

  const handleProceed = () => {
    onLocationConfirmed({
      latitude: lat,
      longitude: lng,
      address
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mb-3">
          <MapPin className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {lang === 'en' ? 'Confirm Issue Location' : 'समस्या का स्थान सत्यापित करें'}
        </h2>
        <p className="text-slate-600 text-sm mt-1">
          {lang === 'en'
            ? 'Civic authorities require an accurate physical location for on-ground field team dispatch.'
            : 'नागरिक विभाग को स्थल निरीक्षण हेतु सटीक स्थान की आवश्यकता होती है।'}
        </p>
      </div>

      {/* GPS Button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          className="flex-1 py-3 px-4 rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold text-sm flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Acquiring GPS Fix...' : 'Use My Current Phone GPS'}</span>
        </button>
      </div>

      {/* Test Quick Selects for Demo */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
        <span className="font-bold text-slate-700 uppercase tracking-wider block mb-2">
          Demo Quick Jump (Instant Testing):
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTestPreset('Delhi MCD', 28.6448, 77.2167, 'Ajmeri Gate, Central Delhi, New Delhi 110006')}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 font-medium text-slate-700"
          >
            Delhi MCD (Central)
          </button>
          <button
            type="button"
            onClick={() => setTestPreset('Delhi DJB', 28.5672, 77.2100, 'Ring Road near AIIMS, South Delhi, New Delhi 110029')}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 font-medium text-slate-700"
          >
            Delhi DJB (South)
          </button>
          <button
            type="button"
            onClick={() => setTestPreset('Bengaluru BBMP', 12.9352, 77.6245, '80 Feet Road, 4th Block, Koramangala, Bengaluru 560034')}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 font-medium text-slate-700"
          >
            Bengaluru BBMP
          </button>
        </div>
      </div>

      {/* Address & Coords Display */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {lang === 'en' ? 'Street Address / Landmark' : 'सड़क का पता / मुख्य पहचान चिन्ह'}
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            placeholder="e.g. Near Metro Pillar 142, Main Market Road"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Latitude</span>
            <span className="text-sm font-mono font-bold text-slate-800">{lat.toFixed(6)}° N</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Longitude</span>
            <span className="text-sm font-mono font-bold text-slate-800">{lng.toFixed(6)}° E</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
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
          onClick={handleProceed}
          className="px-6 py-2.5 rounded-xl font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow transition flex items-center space-x-2 text-sm"
        >
          <span>{lang === 'en' ? 'Resolve Authority & Duplicates' : 'विभाग व दोहराव की जांच करें'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
