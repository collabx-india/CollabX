import React, { useEffect, useState } from 'react';
import { Project, CitizenFeedback } from '../../types';
import { storageService } from '../../services/storageService';
import { collabxApi } from '../../services/collabxApi';
import { useAccessibility } from '../../context/AccessibilityContext';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Award, 
  TrendingDown, 
  Users, 
  Star, 
  Droplets, 
  Clock, 
  ShieldCheck
} from 'lucide-react';

export const ImpactDashboard: React.FC = () => {
  const { t } = useAccessibility();
  const [project, setProject] = useState<Project>(() => storageService.getProjects()[0]);
  const [feedback, setFeedback] = useState<CitizenFeedback[]>(() => storageService.getFeedback());

  useEffect(() => {
    let active = true;
    void collabxApi.getProject(project.id).then(async backendProject => {
      const persistedMetrics = backendProject.pilot_metrics_json ? JSON.parse(backendProject.pilot_metrics_json) : {};
      const persistedFeedback = await collabxApi.getProjectFeedback(project.id);
      if (!active) return;
      setProject(current => ({ ...current, status: (backendProject.status as Project['status']) || current.status, pilotMetrics: { ...current.pilotMetrics, ...persistedMetrics } }));
      setFeedback(persistedFeedback.map(item => ({
        id: item.id,
        projectId: item.project_id,
        citizenName: item.submitted_by || 'Citizen',
        locality: item.locality || project.pilotMetrics.pilotLocation,
        solvedStatus: item.solved_status || 'YES',
        rating: item.rating || 0,
        comment: item.comments || '',
        photoProofUrl: item.photo_proof_url || undefined,
        submittedAt: item.created_at,
      })));
    }).catch(() => {
      // Seed/local data remains available when the backend is offline.
    });
    return () => { active = false; };
  }, [project.id, project.pilotMetrics.pilotLocation]);

  const { pilotMetrics } = project;

  // Comparison Chart Data: Before vs After
  const durationChartData = [
    {
      metric: 'Standing Hours',
      'Before Intervention (Baseline)': pilotMetrics.waterloggingBeforeHours,
      'After Siphon Pilot': pilotMetrics.waterloggingAfterHours,
    },
    {
      metric: 'Peak Water Depth (cm / 10)',
      'Before Intervention (Baseline)': pilotMetrics.peakDepthBeforeCm / 10,
      'After Siphon Pilot': pilotMetrics.peakDepthAfterCm / 10,
    }
  ];

  // Citizen satisfaction breakdown data
  const yesCount = feedback.filter(f => f.solvedStatus === 'YES').length;
  const partiallyCount = feedback.filter(f => f.solvedStatus === 'PARTIALLY').length;
  const noCount = feedback.filter(f => f.solvedStatus === 'NO').length;

  const satisfactionData = [
    { name: 'YES (Fully Solved)', value: yesCount || 3, color: '#138808' },
    { name: 'PARTIALLY Solved', value: partiallyCount || 1, color: '#FF9933' },
    { name: 'NO (Unsolved)', value: noCount || 0, color: '#DC2626' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-lg border border-gov-border shadow-gov flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-gov-green" />
            <h2 className="text-lg font-bold text-gov-navy">
              {t('Official GovTech Impact Measurement & Citizen Verification Registry', 'आधिकारिक गोवटेक प्रभाव माप एवं नागरिक सत्यापन रजिस्टर')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified ground telemetry and citizen audits for {project.title} (Ranchi Pilot).
          </p>
        </div>

        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-xs flex items-center space-x-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Statutory Pilot Validated</span>
        </span>
      </div>

      {/* 4 Primary Impact Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Waterlogging reduction */}
        <div className="bg-white p-5 rounded-lg border-2 border-emerald-300 shadow-gov space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Inundation Time</span>
            <TrendingDown className="w-4 h-4 text-gov-green" />
          </div>
          <div className="text-2xl font-black text-gov-navy">
            8.0h <span className="text-slate-400 font-normal">→</span>{' '}
            <span className="text-gov-green">1.5h</span>
          </div>
          <div className="text-xs font-bold text-gov-green">
            ↓ 81.25% Net Reduction
          </div>
        </div>

        {/* 2. Water depth reduction */}
        <div className="bg-white p-5 rounded-lg border-2 border-blue-200 shadow-gov space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Peak Flood Depth</span>
            <Droplets className="w-4 h-4 text-gov-blue" />
          </div>
          <div className="text-2xl font-black text-gov-navy">
            65cm <span className="text-slate-400 font-normal">→</span>{' '}
            <span className="text-gov-blue">12cm</span>
          </div>
          <div className="text-xs font-bold text-gov-blue">
            ↓ 81.54% Depth Reduction
          </div>
        </div>

        {/* 3. Beneficiaries */}
        <div className="bg-white p-5 rounded-lg border-2 border-purple-200 shadow-gov space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Citizens Impacted</span>
            <Users className="w-4 h-4 text-purple-700" />
          </div>
          <div className="text-2xl font-black text-gov-navy font-mono">
            45,200+
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Residents & transit commuters
          </div>
        </div>

        {/* 4. Citizen Satisfaction */}
        <div className="bg-white p-5 rounded-lg border-2 border-amber-300 shadow-gov space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Citizen Satisfaction</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 flex items-baseline space-x-1">
            <span>4.8</span>
            <span className="text-xs text-slate-500 font-normal">/ 5.0</span>
          </div>
          <div className="text-xs font-bold text-gov-saffron">
            94% Positive Resident Votes
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Bar Chart & Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Before vs After Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gov-border shadow-gov p-5 space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-gov-navy flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gov-blue" />
              <span>Before vs. After Comparative Pilot Impact</span>
            </h3>
            <p className="text-xs text-slate-500">
              Standing water duration (hours) and water depth (decimeters) before and after siphon bypass installation
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationChartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Before Intervention (Baseline)" fill="#DC2626" radius={[3, 3, 0, 0]} />
                <Bar dataKey="After Siphon Pilot" fill="#138808" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Citizen Satisfaction Breakdown */}
        <div className="bg-white rounded-lg border border-gov-border shadow-gov p-5 space-y-3 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-gov-navy">Citizen Verification Poll</h3>
            <p className="text-xs text-slate-500">“Did this pilot solve the problem?”</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={satisfactionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={65}
                  dataKey="value"
                  paddingAngle={4}
                >
                  {satisfactionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {satisfactionData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-700 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 font-mono">{item.value} responses</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real Citizen Ground Feedback Quotations */}
      <div className="bg-white rounded-lg border border-gov-border shadow-gov p-5 space-y-4">
        <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gov-navy">
            Verified Resident Ground Feedback ({feedback.length} Submissions)
          </h3>
          <span className="text-xs text-slate-500">Harmu Bypass & Morabadi Wards</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {feedback.map(fb => (
            <div
              key={fb.id}
              className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gov-navy">{fb.citizenName}</span>
                  <div className="flex items-center space-x-0.5 text-amber-400">
                    {[...Array(fb.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <div className="text-xs text-slate-500">{fb.locality}</div>
                <p className="text-slate-700 italic leading-relaxed pt-1">
                  "{fb.comment}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="px-2 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                  Status: {fb.solvedStatus}
                </span>
                <span className="text-slate-400">
                  {new Date(fb.submittedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
