import React, { useState } from 'react';
import { ProblemReport } from '../../types';
import { MapPin, Info, Compass, CheckCircle2 } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

interface JharkhandMapProps {
  problems: ProblemReport[];
  selectedProblemId?: string;
  onSelectProblem?: (problem: ProblemReport) => void;
}

interface DistrictCoord {
  id: string;
  name: string;
  hindiName: string;
  cx: number;
  cy: number;
  isMainHotspot?: boolean;
}

// Stylized geographical layout of Jharkhand districts (Normalized viewBox 0 0 600 450)
const JHARKHAND_DISTRICTS: DistrictCoord[] = [
  { id: 'ranchi', name: 'Ranchi', hindiName: 'राँची', cx: 300, cy: 260, isMainHotspot: true },
  { id: 'dhanbad', name: 'Dhanbad', hindiName: 'धनबाद', cx: 430, cy: 190, isMainHotspot: true },
  { id: 'e_singhbhum', name: 'East Singhbhum (Jamshedpur)', hindiName: 'पूर्वी सिंहभूम', cx: 420, cy: 360, isMainHotspot: true },
  { id: 'bokaro', name: 'Bokaro', hindiName: 'बोकारो', cx: 390, cy: 220, isMainHotspot: true },
  { id: 'hazaribagh', name: 'Hazaribagh', hindiName: 'हज़ारीबाग', cx: 305, cy: 170, isMainHotspot: true },
  { id: 'deoghar', name: 'Deoghar', hindiName: 'देवघर', cx: 450, cy: 110, isMainHotspot: true },
  { id: 'ramgarh', name: 'Ramgarh', hindiName: 'रामगढ़', cx: 335, cy: 230 },
  { id: 'khunti', name: 'Khunti', hindiName: 'खूँटी', cx: 290, cy: 310 },
  { id: 'gumla', name: 'Gumla', hindiName: 'गुमला', cx: 190, cy: 300 },
  { id: 'simdega', name: 'Simdega', hindiName: 'सिमडेगा', cx: 200, cy: 380 },
  { id: 'w_singhbhum', name: 'West Singhbhum', hindiName: 'पश्चिमी सिंहभूम', cx: 330, cy: 380 },
  { id: 'seraikela', name: 'Seraikela-Kharsawan', hindiName: 'सरायकेला', cx: 370, cy: 330 },
  { id: 'lohardaga', name: 'Lohardaga', hindiName: 'लोहरदगा', cx: 230, cy: 250 },
  { id: 'latehar', name: 'Latehar', hindiName: 'लातेहार', cx: 200, cy: 200 },
  { id: 'palamu', name: 'Palamu', hindiName: 'पलामू', cx: 150, cy: 150 },
  { id: 'garhwa', name: 'Garhwa', hindiName: 'गढ़वा', cx: 90, cy: 130 },
  { id: 'chatra', name: 'Chatra', hindiName: 'चतरा', cx: 230, cy: 140 },
  { id: 'koderma', name: 'Koderma', hindiName: 'कोडरमा', cx: 340, cy: 120 },
  { id: 'giridih', name: 'Giridih', hindiName: 'गिरिडीह', cx: 400, cy: 150 },
  { id: 'dumka', name: 'Dumka', hindiName: 'दुमका', cx: 500, cy: 140 },
  { id: 'jamtara', name: 'Jamtara', hindiName: 'जामताड़ा', cx: 470, cy: 190 },
  { id: 'godda', name: 'Godda', hindiName: 'गोड्डा', cx: 540, cy: 100 },
  { id: 'sahibganj', name: 'Sahibganj', hindiName: 'साहिबगंज', cx: 560, cy: 60 },
  { id: 'pakur', name: 'Pakur', hindiName: 'पाकुड़', cx: 550, cy: 150 },
];

export const JharkhandMap: React.FC<JharkhandMapProps> = ({
  problems,
  selectedProblemId,
  onSelectProblem,
}) => {
  const [activeDistrict, setActiveDistrict] = useState<string | null>('Ranchi');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const { t } = useAccessibility();

  const filteredProblems = problems.filter(p => {
    if (filterSeverity === 'critical') return p.aiAnalysis.priority === 'Critical';
    if (filterSeverity === 'high') return p.aiAnalysis.priority === 'High';
    return true;
  });

  const getDistrictProblems = (districtName: string) => {
    return filteredProblems.filter(p => p.district.toLowerCase().includes(districtName.toLowerCase()));
  };

  return (
    <div className="bg-white rounded-lg border border-gov-border shadow-gov overflow-hidden">
      {/* Map Header */}
      <div className="bg-gov-navy px-4 py-3 flex flex-wrap items-center justify-between text-white gap-2">
        <div className="flex items-center space-x-2">
          <Compass className="w-5 h-5 text-gov-saffron-amber" />
          <div>
            <h2 className="text-sm font-bold">
              {t('Jharkhand GovTech Spatial Grievance Map', 'झारखंड राज्य स्थानिक समस्या मानचित्र')}
            </h2>
            <p className="text-xs text-slate-300">
              {t('District-level distribution of verified problems & pilot deployments', 'जिलावार सत्यापित समस्याएं एवं पायलट परिनियोजन')}
            </p>
          </div>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-300">{t('Filter:', 'फ़िल्टर:')}</span>
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="bg-gov-navy-dark text-white text-xs border border-slate-700 rounded px-2 py-1 focus:ring-1 focus:ring-amber-400"
          >
            <option value="all">{t('All Priorities', 'सभी प्राथमिकताएं')}</option>
            <option value="critical">{t('Critical (90+ Severity)', 'अति गंभीर (90+)')}</option>
            <option value="high">{t('High Priority', 'उच्च प्राथमिकता')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* SVG Interactive Map Canvas */}
        <div className="lg:col-span-2 p-4 bg-slate-50 relative flex items-center justify-center border-b lg:border-b-0 lg:border-r border-gov-border min-h-[380px]">
          <svg
            viewBox="0 0 620 440"
            className="w-full h-auto max-h-[420px] select-none"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(10,37,64,0.08))' }}
          >
            {/* Background State Polygon Silhouette */}
            <path
              d="M 80 130 L 150 140 L 220 120 L 320 100 L 440 90 L 550 50 L 580 80 L 560 180 L 490 200 L 450 370 L 390 400 L 300 400 L 190 390 L 180 300 L 80 170 Z"
              fill="#E2E8F0"
              stroke="#CBD5E1"
              strokeWidth="1.5"
              strokeDasharray="4,2"
            />

            {/* Connecting River Silhouette: Subarnarekha & Damodar (Gov context) */}
            <path
              d="M 220 180 Q 300 210 390 220 T 470 190"
              fill="none"
              stroke="#93C5FD"
              strokeWidth="2.5"
              opacity="0.7"
            />
            <path
              d="M 280 270 Q 350 310 430 360"
              fill="none"
              stroke="#60A5FA"
              strokeWidth="2"
              opacity="0.6"
            />

            {/* Districts Nodes */}
            {JHARKHAND_DISTRICTS.map(district => {
              const districtProblems = getDistrictProblems(district.name.split(' ')[0]);
              const hasProblems = districtProblems.length > 0;
              const isSelected = activeDistrict?.toLowerCase().includes(district.name.split(' ')[0].toLowerCase());

              return (
                <g
                  key={district.id}
                  onClick={() => setActiveDistrict(district.name)}
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  {/* District Area Node */}
                  <circle
                    cx={district.cx}
                    cy={district.cy}
                    r={district.isMainHotspot ? 24 : 16}
                    fill={isSelected ? '#1B365D' : hasProblems ? '#FFFFFF' : '#F1F5F9'}
                    stroke={isSelected ? '#FF9933' : hasProblems ? '#0A2540' : '#CBD5E1'}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="transition-colors duration-200"
                  />

                  {/* Problem Pulse Ring if Active */}
                  {hasProblems && (
                    <circle
                      cx={district.cx}
                      cy={district.cy}
                      r={district.isMainHotspot ? 28 : 20}
                      fill="none"
                      stroke={districtProblems.some(p => p.aiAnalysis.priority === 'Critical') ? '#DC2626' : '#E65100'}
                      strokeWidth="1.5"
                      strokeDasharray="3,3"
                      opacity="0.8"
                    />
                  )}

                  {/* Problem Count Badge */}
                  {hasProblems && (
                    <circle
                      cx={district.cx + 12}
                      cy={district.cy - 12}
                      r="8"
                      fill="#E65100"
                    />
                  )}
                  {hasProblems && (
                    <text
                      x={district.cx + 12}
                      y={district.cy - 9}
                      fontSize="9"
                      fontWeight="bold"
                      fill="#FFFFFF"
                      textAnchor="middle"
                    >
                      {districtProblems.length}
                    </text>
                  )}

                  {/* District Label */}
                  <text
                    x={district.cx}
                    y={district.cy + 3}
                    fontSize={district.isMainHotspot ? '10' : '8'}
                    fontWeight={isSelected ? 'bold' : '500'}
                    fill={isSelected ? '#FFFFFF' : '#1E293B'}
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {district.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Map Legend */}
          <div className="absolute bottom-2 left-3 bg-white/95 backdrop-blur-sm p-2.5 rounded border border-gov-border text-xs space-y-1.5 shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gov-navy border border-amber-400"></span>
              <span className="text-slate-700 font-medium">Selected District</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gov-saffron"></span>
              <span className="text-slate-700 font-medium">Reported Problem Hotspot</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gov-green"></span>
              <span className="text-slate-700 font-medium">Active Pilot Deployed</span>
            </div>
          </div>
        </div>

        {/* District Detail Sidebar */}
        <div className="p-4 flex flex-col justify-between max-h-[420px] overflow-y-auto">
          <div>
            <div className="flex items-center justify-between border-b border-gov-border pb-2 mb-3">
              <div>
                <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  {t('District Overview', 'जिला विवरणी')}
                </span>
                <h3 className="text-base font-bold text-gov-navy flex items-center space-x-1">
                  <MapPin className="w-4 h-4 text-gov-saffron" />
                  <span>{activeDistrict || 'Select a District'}</span>
                </h3>
              </div>
              <span className="text-xs bg-gov-blue-50 text-gov-blue font-bold px-2 py-0.5 rounded border border-gov-border">
                {getDistrictProblems(activeDistrict?.split(' ')[0] || '').length} {t('Active', 'सक्रिय')}
              </span>
            </div>

            {/* List of problems in this district */}
            <div className="space-y-2">
              {getDistrictProblems(activeDistrict?.split(' ')[0] || '').length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded text-center text-xs text-slate-500">
                  <Info className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                  {t('No urgent grievances flagged in this district.', 'इस जिले में कोई गंभीर समस्या दर्ज नहीं है।')}
                </div>
              ) : (
                getDistrictProblems(activeDistrict?.split(' ')[0] || '').map(prob => (
                  <div
                    key={prob.id}
                    onClick={() => onSelectProblem && onSelectProblem(prob)}
                    className={`p-2.5 rounded border text-left cursor-pointer transition ${
                      selectedProblemId === prob.id
                        ? 'bg-blue-50/80 border-gov-blue shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-semibold text-slate-600">{prob.id}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded font-bold ${
                          prob.aiAnalysis.priority === 'Critical'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {prob.aiAnalysis.priority}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 line-clamp-2">{prob.title}</div>
                    <div className="text-xs text-slate-600 mt-1 flex items-center justify-between">
                      <span>{prob.panchayatOrLocality}</span>
                      <span className="font-medium text-gov-navy">
                        {prob.status === 'pilot_deployed' ? 'Active Pilot' : prob.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-gov-border mt-3 text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-gov-green" />
              <span>GIS Layer: WGS84 Datum</span>
            </span>
            <span className="font-mono text-xs font-medium">RMC-JUIDCO Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};
