import React, { useState, useMemo } from 'react';
import { ProblemReport, ProblemStatus } from '../../types';
import { useAccessibility } from '../../context/AccessibilityContext';
import { isSameInstitution } from '../../services/storageService';
import { UNIVERSITIES } from '../../data/universityDepartments';
import { 
  Building2, 
  Filter, 
  RotateCcw, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck,
  Activity,
  Layers,
  GraduationCap
} from 'lucide-react';

interface RegionalProblemIntelligenceProps {
  problems: ProblemReport[];
}

const LIFECYCLE_STAGES: { key: ProblemStatus; label: string; hindiLabel: string; order: number }[] = [
  { key: 'submitted', label: 'Submitted', hindiLabel: 'दर्ज किया गया', order: 1 },
  { key: 'ai_analyzed', label: 'AI Analyzed', hindiLabel: 'एआई विश्लेषित', order: 2 },
  { key: 'university_matched', label: 'University Matched', hindiLabel: 'विश्वविद्यालय मिलान', order: 3 },
  { key: 'university_adopted', label: 'University Adopted', hindiLabel: 'विश्वविद्यालय स्वीकृत', order: 4 },
  { key: 'team_formed', label: 'Team Formed', hindiLabel: 'शोध दल गठित', order: 5 },
  { key: 'solution_development', label: 'Solution Development', hindiLabel: 'समाधान विकास', order: 6 },
  { key: 'industry_collaboration', label: 'Industry Collaboration', hindiLabel: 'उद्योग सहयोग', order: 7 },
  { key: 'prototype', label: 'Prototype', hindiLabel: 'प्रोटोटाइप', order: 8 },
  { key: 'pilot', label: 'Pilot', hindiLabel: 'पायलट परीक्षण', order: 9 },
  { key: 'implementation', label: 'Implementation', hindiLabel: 'कार्यान्वयन', order: 10 },
  { key: 'completed', label: 'Completed', hindiLabel: 'पूर्ण', order: 11 },
];

export const RegionalProblemIntelligence: React.FC<RegionalProblemIntelligenceProps> = ({ problems }) => {
  const { t } = useAccessibility();

  // ---------------------------------------------------------------------------
  // 1. GLOBAL FILTER STATE (Single Source of Truth)
  // ---------------------------------------------------------------------------
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedUniversity, setSelectedUniversity] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isCoordinatesExpanded, setIsCoordinatesExpanded] = useState<boolean>(false);

  // Available filter options derived dynamically from dataset
  const districtsList = useMemo(() => {
    const set = new Set<string>();
    problems.forEach(p => {
      if (p.district) set.add(p.district);
    });
    return Array.from(set).sort();
  }, [problems]);

  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    problems.forEach(p => {
      if (p.aiAnalysis?.category) set.add(p.aiAnalysis.category);
    });
    return Array.from(set).sort();
  }, [problems]);

  const universitiesFilterList = useMemo(() => {
    const items: { id: string; name: string }[] = [];
    UNIVERSITIES.forEach(u => items.push({ id: u.id, name: u.shortName }));
    return items;
  }, []);

  const monthsList = useMemo(() => {
    const map = new Map<string, string>();
    problems.forEach(p => {
      if (p.createdAt) {
        const d = new Date(p.createdAt);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
          if (!map.has(key)) map.set(key, label);
        }
      }
    });
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [problems]);

  // ---------------------------------------------------------------------------
  // 2. FILTERED DATASET (Controlling All Panels)
  // ---------------------------------------------------------------------------
  const filteredProblems = useMemo(() => {
    return problems.filter(p => {
      if (selectedDistrict !== 'all' && p.district !== selectedDistrict) return false;
      if (selectedCategory !== 'all' && p.aiAnalysis?.category !== selectedCategory) return false;
      if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
      if (selectedUniversity !== 'all') {
        const univObj = UNIVERSITIES.find(u => u.id === selectedUniversity);
        const nameToMatch = univObj ? univObj.name : selectedUniversity;
        const shortNameToMatch = univObj ? univObj.shortName : selectedUniversity;

        const matches = 
          p.matchedUniversityId === selectedUniversity ||
          isSameInstitution(p.matchedUniversity, nameToMatch) ||
          isSameInstitution(p.matchedUniversity, shortNameToMatch) ||
          (p.aiAnalysis?.matchedUniversity && isSameInstitution(p.aiAnalysis.matchedUniversity, nameToMatch));

        if (!matches) return false;
      }
      if (selectedMonth !== 'all') {
        if (!p.createdAt) return false;
        const d = new Date(p.createdAt);
        if (isNaN(d.getTime())) return false;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (key !== selectedMonth) return false;
      }
      return true;
    });
  }, [problems, selectedDistrict, selectedCategory, selectedStatus, selectedUniversity, selectedMonth]);

  const hasActiveFilters = 
    selectedDistrict !== 'all' || 
    selectedCategory !== 'all' || 
    selectedStatus !== 'all' || 
    selectedUniversity !== 'all' || 
    selectedMonth !== 'all';

  const resetFilters = () => {
    setSelectedDistrict('all');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedUniversity('all');
    setSelectedMonth('all');
  };

  // ---------------------------------------------------------------------------
  // 3. EXECUTIVE MONITORING KPIS (Strictly separate, uncombined metrics)
  // ---------------------------------------------------------------------------
  const executiveMetrics = useMemo(() => {
    const total = filteredProblems.length;
    const aiAnalyzed = filteredProblems.filter(p => p.status === 'ai_analyzed').length;
    const universityMatched = filteredProblems.filter(p => p.status === 'university_matched').length;
    const universityAdopted = filteredProblems.filter(p => p.status === 'university_adopted').length;
    const inDevelopment = filteredProblems.filter(p => 
      ['team_formed', 'solution_development', 'prototype'].includes(p.status)
    ).length;
    const pilotImplementation = filteredProblems.filter(p => 
      ['pilot', 'implementation'].includes(p.status)
    ).length;
    const completed = filteredProblems.filter(p => p.status === 'completed').length;
    const industryCollaboration = filteredProblems.filter(p => 
      Boolean(p.industryPartnerName && p.industryPartnerName.trim() !== '') ||
      Boolean(p.industrySupportOffers && p.industrySupportOffers.some(o => o.status === 'accepted'))
    ).length;

    return {
      total,
      aiAnalyzed,
      universityMatched,
      universityAdopted,
      inDevelopment,
      pilotImplementation,
      completed,
      industryCollaboration,
    };
  }, [filteredProblems]);

  // ---------------------------------------------------------------------------
  // 4. DISTRICT ANALYSIS CALCULATION
  // ---------------------------------------------------------------------------
  const districtDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProblems.forEach(p => {
      const dist = p.district || 'Unassigned District';
      counts[dist] = (counts[dist] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([district, count]) => ({
        district,
        count,
        percentage: filteredProblems.length > 0 ? Math.round((count / filteredProblems.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredProblems]);

  const maxDistrictCount = districtDistribution[0]?.count || 1;

  // ---------------------------------------------------------------------------
  // 5. PROBLEM CATEGORY ANALYSIS CALCULATION
  // ---------------------------------------------------------------------------
  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProblems.forEach(p => {
      const cat = p.aiAnalysis?.category || 'General Civic Infrastructure';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: filteredProblems.length > 0 ? Math.round((count / filteredProblems.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredProblems]);

  const maxCategoryCount = categoryDistribution[0]?.count || 1;

  // ---------------------------------------------------------------------------
  // 6. INNOVATION PIPELINE (11 Stages)
  // ---------------------------------------------------------------------------
  const lifecycleCounts = useMemo(() => {
    return LIFECYCLE_STAGES.map(stage => {
      const count = filteredProblems.filter(p => p.status === stage.key).length;
      return {
        ...stage,
        count,
      };
    });
  }, [filteredProblems]);

  // ---------------------------------------------------------------------------
  // 7. UNIVERSITY ENGAGEMENT TABLE CALCULATION
  // ---------------------------------------------------------------------------
  const universityTableRows = useMemo(() => {
    return UNIVERSITIES.map(u => {
      const routedCount = filteredProblems.filter(p => 
        p.matchedUniversityId === u.id ||
        isSameInstitution(p.matchedUniversity, u.name) ||
        isSameInstitution(p.matchedUniversity, u.shortName) ||
        (p.aiAnalysis?.matchedUniversity && isSameInstitution(p.aiAnalysis.matchedUniversity, u.name))
      ).length;

      const adoptedCount = filteredProblems.filter(p => {
        const isMatched = p.matchedUniversityId === u.id ||
          isSameInstitution(p.matchedUniversity, u.name) ||
          isSameInstitution(p.matchedUniversity, u.shortName);
        return isMatched && ['university_adopted', 'team_formed', 'solution_development', 'industry_collaboration', 'prototype', 'pilot', 'implementation', 'completed'].includes(p.status);
      }).length;

      const developmentCount = filteredProblems.filter(p => {
        const isMatched = p.matchedUniversityId === u.id ||
          isSameInstitution(p.matchedUniversity, u.name) ||
          isSameInstitution(p.matchedUniversity, u.shortName);
        return isMatched && ['team_formed', 'solution_development', 'industry_collaboration', 'prototype', 'pilot', 'implementation'].includes(p.status);
      }).length;

      const completedCount = filteredProblems.filter(p => {
        const isMatched = p.matchedUniversityId === u.id ||
          isSameInstitution(p.matchedUniversity, u.name) ||
          isSameInstitution(p.matchedUniversity, u.shortName);
        return isMatched && p.status === 'completed';
      }).length;

      return {
        institution: u.name,
        shortName: u.shortName,
        routed: routedCount,
        adopted: adoptedCount,
        development: developmentCount,
        completed: completedCount,
      };
    });
  }, [filteredProblems]);

  const universityTotals = useMemo(() => {
    return universityTableRows.reduce(
      (acc, r) => ({
        routed: acc.routed + r.routed,
        adopted: acc.adopted + r.adopted,
        development: acc.development + r.development,
        completed: acc.completed + r.completed,
      }),
      { routed: 0, adopted: 0, development: 0, completed: 0 }
    );
  }, [universityTableRows]);

  // ---------------------------------------------------------------------------
  // 8. LOCATION INTELLIGENCE CALCULATION
  // ---------------------------------------------------------------------------
  const districtLocationSummary = useMemo(() => {
    const summary: Record<string, { totalReports: number; withCoords: number }> = {};
    filteredProblems.forEach(p => {
      const dist = p.district || 'Unassigned District';
      if (!summary[dist]) {
        summary[dist] = { totalReports: 0, withCoords: 0 };
      }
      summary[dist].totalReports += 1;
      if (p.coordinates && typeof p.coordinates.lat === 'number' && typeof p.coordinates.lng === 'number') {
        summary[dist].withCoords += 1;
      }
    });

    return Object.entries(summary)
      .map(([district, data]) => ({
        district,
        totalReports: data.totalReports,
        withCoords: data.withCoords,
        percentageGeocoded: data.totalReports > 0 ? Math.round((data.withCoords / data.totalReports) * 100) : 0,
      }))
      .sort((a, b) => b.totalReports - a.totalReports);
  }, [filteredProblems]);

  const localityDistribution = useMemo(() => {
    const map: Record<string, { district: string; locality: string; count: number }> = {};
    filteredProblems.forEach(p => {
      const dist = p.district || 'Unknown District';
      const loc = p.panchayatOrLocality || 'General Area';
      const key = `${dist}|${loc}`;
      if (!map[key]) {
        map[key] = { district: dist, locality: loc, count: 0 };
      }
      map[key].count += 1;
    });

    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [filteredProblems]);

  const reportsWithCoordinates = useMemo(() => {
    return filteredProblems.filter(p => p.coordinates && typeof p.coordinates.lat === 'number' && typeof p.coordinates.lng === 'number');
  }, [filteredProblems]);

  // ---------------------------------------------------------------------------
  // 9. MONITORING SIGNALS (Strictly Factual Only)
  // ---------------------------------------------------------------------------
  const monitoringSignals = useMemo(() => {
    const topDistrict = districtDistribution[0];
    const topUniversity = [...universityTableRows].sort((a, b) => b.routed - a.routed)[0];

    return {
      awaitingAdoption: filteredProblems.filter(p => p.status === 'university_matched').length,
      inDevelopment: executiveMetrics.inDevelopment,
      inPilot: filteredProblems.filter(p => p.status === 'pilot').length,
      completed: executiveMetrics.completed,
      topDistrictText: topDistrict ? `${topDistrict.district} (${topDistrict.count} reports, ${topDistrict.percentage}%)` : 'None in scope',
      topUniversityText: topUniversity && topUniversity.routed > 0 ? `${topUniversity.shortName} (${topUniversity.routed} routed)` : 'None in scope',
    };
  }, [districtDistribution, universityTableRows, filteredProblems, executiveMetrics]);

  return (
    <div className="space-y-6" role="region" aria-label="Government Monitoring and Analytics Dashboard">
      
      {/* ========================================================================= */}
      {/* SECTION HEADER                                                            */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-gov-navy inline" />
                {t('Administrative Monitoring Desk', 'प्रशासनिक निगरानी पटल')}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
                STRICTLY READ-ONLY TELEMETRY
              </span>
            </div>
            <h2 className="gov-h2 text-gov-navy leading-tight">
              {t('Regional Problem Intelligence & Monitoring', 'क्षेत्रीय समस्या निगरानी एवं विश्लेषिकी')}
            </h2>
            <p className="gov-body text-slate-600 mt-1 max-w-4xl">
              {t(
                'Statewide administrative oversight tracking citizen problems, institutional research allocation, engineering pipeline stages, and field implementation across Jharkhand.',
                'झारखंड भर में नागरिक समस्याओं, संस्थागत अनुसंधान आवंटन, इंजीनियरिंग पाइपलाइन चरणों और क्षेत्रीय कार्यान्वयन की राज्यव्यापी प्रशासनिक निगरानी।'
              )}
            </p>
          </div>

          <div className="shrink-0 flex items-center">
            <div className="bg-slate-50 border border-slate-300 rounded-md px-4 py-2 text-right">
              <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                {t('Active Filter Scope', 'सक्रिय फ़िल्टर दायरा')}
              </div>
              <div className="text-lg font-black font-mono text-gov-navy">
                {filteredProblems.length} <span className="text-xs font-normal text-slate-600">/ {problems.length} {t('Reports', 'रिपोर्ट')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="mt-4 pt-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-slate-800 font-semibold text-sm">
              <Filter className="w-4 h-4 text-gov-navy" />
              <span>{t('Global Monitoring Filters', 'वैश्विक निगरानी फ़िल्टर')}</span>
              <span className="text-xs text-slate-500 font-normal">
                ({t('All panels update synchronously', 'सभी पैनल समकालिक रूप से अपडेट होते हैं')})
              </span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs sm:text-sm font-semibold text-blue-800 hover:text-blue-950 flex items-center space-x-1.5 transition underline underline-offset-4 focus:outline-none"
                aria-label="Reset all filters to defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('Reset Filters', 'फ़िल्टर रीसेट करें')}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. District Filter */}
            <div>
              <label htmlFor="filter-district" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t('District', 'ज़िला')}
              </label>
              <select
                id="filter-district"
                value={selectedDistrict}
                onChange={e => setSelectedDistrict(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded py-2 px-3 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
              >
                <option value="all">{t('All Districts (Statewide)', 'सभी ज़िले (संपूर्ण राज्य)')}</option>
                {districtsList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* 2. Problem Category Filter */}
            <div>
              <label htmlFor="filter-category" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t('Category', 'श्रेणी')}
              </label>
              <select
                id="filter-category"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded py-2 px-3 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
              >
                <option value="all">{t('All Categories', 'सभी श्रेणियाँ')}</option>
                {categoriesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* 3. Lifecycle Stage Filter */}
            <div>
              <label htmlFor="filter-status" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t('Lifecycle Stage', 'जीवनचक्र चरण')}
              </label>
              <select
                id="filter-status"
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded py-2 px-3 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
              >
                <option value="all">{t('All 11 Stages', 'सभी 11 चरण')}</option>
                {LIFECYCLE_STAGES.map(s => (
                  <option key={s.key} value={s.key}>
                    #{s.order} {s.label} ({t(s.label, s.hindiLabel)})
                  </option>
                ))}
              </select>
            </div>

            {/* 4. University Filter */}
            <div>
              <label htmlFor="filter-university" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t('University / Institution', 'विश्वविद्यालय / संस्थान')}
              </label>
              <select
                id="filter-university"
                value={selectedUniversity}
                onChange={e => setSelectedUniversity(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded py-2 px-3 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
              >
                <option value="all">{t('All Institutions', 'सभी संस्थान')}</option>
                {universitiesFilterList.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* 5. Date / Month Filter */}
            <div>
              <label htmlFor="filter-month" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                {t('Timeline / Month', 'समय सीमा / माह')}
              </label>
              <select
                id="filter-month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded py-2 px-3 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-800 focus:border-blue-800"
              >
                <option value="all">{t('All Recorded Dates', 'सभी दर्ज तिथियां')}</option>
                {monthsList.map(m => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. EXECUTIVE MONITORING SUMMARY (Separate Uncombined Metrics)             */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="gov-h3 text-gov-navy flex items-center space-x-2">
            <span>{t('Executive Monitoring Summary', 'कार्यकारी निगरानी सारांश')}</span>
            <span className="text-xs font-normal text-slate-500">
              ({t('Derived from verified telemetry', 'सत्यापित टेलीमेट्री से प्राप्त')})
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
          {/* 1. Total Problems */}
          <div className="bg-white p-3.5 rounded border border-slate-300 shadow-2xs">
            <span className="text-xs uppercase font-bold text-slate-600 block truncate">Total Problems</span>
            <div className="text-2xl font-black text-gov-navy mt-1 font-mono">{executiveMetrics.total}</div>
            <span className="text-xs text-slate-500 mt-0.5 block">Reported in scope</span>
          </div>

          {/* 2. AI Analyzed */}
          <div className="bg-white p-3.5 rounded border border-slate-300 shadow-2xs">
            <span className="text-xs uppercase font-bold text-blue-900 block truncate">AI Analyzed</span>
            <div className="text-2xl font-black text-blue-900 mt-1 font-mono">{executiveMetrics.aiAnalyzed}</div>
            <span className="text-xs text-slate-500 mt-0.5 block">Awaiting routing</span>
          </div>

          {/* 3. University Matched */}
          <div className="bg-white p-3.5 rounded border border-slate-300 shadow-2xs">
            <span className="text-xs uppercase font-bold text-indigo-900 block truncate">Univ Matched</span>
            <div className="text-2xl font-black text-indigo-950 mt-1 font-mono">{executiveMetrics.universityMatched}</div>
            <span className="text-xs text-slate-500 mt-0.5 block">Pending adoption</span>
          </div>

          {/* 4. University Adopted */}
          <div className="bg-white p-3.5 rounded border border-slate-300 shadow-2xs">
            <span className="text-xs uppercase font-bold text-purple-900 block truncate">Univ Adopted</span>
            <div className="text-2xl font-black text-purple-950 mt-1 font-mono">{executiveMetrics.universityAdopted}</div>
            <span className="text-xs text-slate-500 mt-0.5 block">Accepted by faculty</span>
          </div>

          {/* 5. In Development */}
          <div className="bg-white p-3.5 rounded border border-slate-300 shadow-2xs">
            <span className="text-xs uppercase font-bold text-amber-900 block truncate">In Development</span>
            <div className="text-2xl font-black text-amber-950 mt-1 font-mono">{executiveMetrics.inDevelopment}</div>
            <span className="text-xs text-slate-500 mt-0.5 block">R&D / Prototype</span>
          </div>

          {/* 6. Pilot / Implementation */}
          <div className="bg-white p-3.5 rounded border border-slate-300 shadow-2xs">
            <span className="text-xs uppercase font-bold text-teal-900 block truncate">Pilot / Deploy</span>
            <div className="text-2xl font-black text-teal-950 mt-1 font-mono">{executiveMetrics.pilotImplementation}</div>
            <span className="text-xs text-slate-500 mt-0.5 block">Field testing</span>
          </div>

          {/* 7. Industry Collaboration */}
          <div className="bg-white p-3.5 rounded border border-slate-300 shadow-2xs">
            <span className="text-xs uppercase font-bold text-slate-800 block truncate">Industry Backed</span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{executiveMetrics.industryCollaboration}</div>
            <span className="text-xs text-slate-500 mt-0.5 block">Verified CSR partner</span>
          </div>

          {/* 8. Completed */}
          <div className="bg-white p-3.5 rounded border border-slate-300 shadow-2xs">
            <span className="text-xs uppercase font-bold text-emerald-900 block truncate">Completed</span>
            <div className="text-2xl font-black text-emerald-900 mt-1 font-mono">{executiveMetrics.completed}</div>
            <span className="text-xs text-slate-500 mt-0.5 block">On-ground solution</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MONITORING SIGNALS (Strictly Factual Only)                             */}
      {/* ========================================================================= */}
      <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 sm:p-5">
        <div className="border-b border-slate-200 pb-2.5 mb-3 flex items-center justify-between">
          <div>
            <h3 className="gov-h3 text-gov-navy flex items-center space-x-2">
              <Activity className="w-4 h-4 text-gov-navy" />
              <span>{t('Monitoring Signals', 'निगरानी संकेत')}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {t('Factual administrative indicators computed directly from the active filter dataset.', 'सक्रिय फ़िल्टर डेटासेट से सीधे परिकलित वास्तविक प्रशासनिक संकेतक।')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          {/* Signal 1: Awaiting Adoption */}
          <div className="bg-white p-3 rounded border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('Matched Awaiting Adoption', 'स्वीकृति हेतु प्रतीक्षित')}
            </div>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-gov-navy">{monitoringSignals.awaitingAdoption}</span>
              <span className="text-xs text-slate-600">
                {monitoringSignals.awaitingAdoption === 1 ? 'problem pending university team adoption' : 'problems pending university team adoption'}
              </span>
            </div>
          </div>

          {/* Signal 2: Active Development */}
          <div className="bg-white p-3 rounded border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('Technical Solutions in Pipeline', 'पाइपलाइन में तकनीकी समाधान')}
            </div>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-gov-navy">{monitoringSignals.inDevelopment}</span>
              <span className="text-xs text-slate-600">
                solutions actively in team formation, R&D, or prototyping
              </span>
            </div>
          </div>

          {/* Signal 3: Field Pilots */}
          <div className="bg-white p-3 rounded border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('Active Municipal / Field Pilots', 'सक्रिय नगरपालिका / क्षेत्रीय पायलट')}
            </div>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-teal-900">{monitoringSignals.inPilot}</span>
              <span className="text-xs text-slate-600">
                {monitoringSignals.inPilot === 1 ? 'project deployed under field validation' : 'projects deployed under field validation'}
              </span>
            </div>
          </div>

          {/* Signal 4: Completed Solutions */}
          <div className="bg-white p-3 rounded border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('Completed Ground Solutions', 'धरातल पर पूर्ण समाधान')}
            </div>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="text-xl font-bold font-mono text-emerald-800">{monitoringSignals.completed}</span>
              <span className="text-xs text-slate-600">
                verified community deployments operational
              </span>
            </div>
          </div>

          {/* Signal 5: District Concentration */}
          <div className="bg-white p-3 rounded border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('Highest Problem Concentration', 'उच्चतम समस्या एकाग्रता ज़िला')}
            </div>
            <div className="mt-1">
              <span className="text-sm font-bold text-slate-900 font-mono block">
                {monitoringSignals.topDistrictText}
              </span>
            </div>
          </div>

          {/* Signal 6: Institutional Matching Lead */}
          <div className="bg-white p-3 rounded border border-slate-200">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('Primary University Routing', 'प्राथमिक विश्वविद्यालय प्रेषण')}
            </div>
            <div className="mt-1">
              <span className="text-sm font-bold text-slate-900 font-mono block">
                {monitoringSignals.topUniversityText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3 & 4. DISTRICT & CATEGORY ANALYTICAL CHARTS (Ranked Horizontal Bars)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* District Analysis */}
        <div className="bg-white rounded-lg border border-slate-300 p-5 space-y-4 shadow-2xs">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h3 className="gov-h3 text-gov-navy">
                {t('Problems by District', 'ज़िलावार समस्याएं')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                {t('Ranked distribution across administrative districts', 'प्रशासनिक ज़िलों में समस्याओं का श्रेणीबद्ध वितरण')}
              </p>
            </div>
            <Building2 className="w-5 h-5 text-slate-400 shrink-0" />
          </div>

          {districtDistribution.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              {t('No problems reported for the selected filter combination.', 'चयनित फ़िल्टर के लिए कोई समस्या दर्ज नहीं है।')}
            </div>
          ) : (
            <div className="space-y-3">
              {districtDistribution.map(item => {
                const barWidth = Math.max(6, Math.round((item.count / maxDistrictCount) * 100));
                return (
                  <div key={item.district} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-800">{item.district}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold font-mono text-gov-navy text-sm">{item.count}</span>
                        <span className="text-xs text-slate-500 font-mono">({item.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded overflow-hidden border border-slate-200">
                      <div
                        className="bg-gov-navy h-full transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                        role="progressbar"
                        aria-valuenow={item.count}
                        aria-valuemin={0}
                        aria-valuemax={maxDistrictCount}
                        aria-label={`${item.district}: ${item.count} problems`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Analysis */}
        <div className="bg-white rounded-lg border border-slate-300 p-5 space-y-4 shadow-2xs">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h3 className="gov-h3 text-gov-navy">
                {t('Problems by Category', 'श्रेणीवार समस्याएं')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                {t('Ranked distribution across technical problem domains', 'तकनीकी समस्या क्षेत्रों में श्रेणीबद्ध वितरण')}
              </p>
            </div>
            <Layers className="w-5 h-5 text-slate-400 shrink-0" />
          </div>

          {categoryDistribution.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              {t('No categories found for the selected filter combination.', 'चयनित फ़िल्टर के लिए कोई श्रेणी उपलब्ध नहीं है।')}
            </div>
          ) : (
            <div className="space-y-3">
              {categoryDistribution.map((item, idx) => {
                const barWidth = Math.max(6, Math.round((item.count / maxCategoryCount) * 100));
                const barColor = idx % 2 === 0 ? 'bg-blue-900' : 'bg-slate-700';
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-800 truncate pr-3" title={item.category}>
                        {item.category}
                      </span>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="font-bold font-mono text-slate-900 text-sm">{item.count}</span>
                        <span className="text-xs text-slate-500 font-mono">({item.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded overflow-hidden border border-slate-200">
                      <div
                        className={`${barColor} h-full transition-all duration-300`}
                        style={{ width: `${barWidth}%` }}
                        role="progressbar"
                        aria-valuenow={item.count}
                        aria-valuemin={0}
                        aria-valuemax={maxCategoryCount}
                        aria-label={`${item.category}: ${item.count} problems`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. INNOVATION PIPELINE (Single Compact 11-Stage Pipeline)                 */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-lg border border-slate-300 p-5 space-y-4 shadow-2xs">
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="gov-h3 text-gov-navy">
              {t('Innovation Lifecycle Progression', 'नवाचार जीवनचक्र प्रगति')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {t('Problem progression across the 11 verified innovation pipeline stages', '11 सत्यापित नवाचार पाइपलाइन चरणों में समस्या की प्रगति')}
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300 self-start sm:self-auto">
            11 VERIFIED STAGES
          </span>
        </div>

        {/* Compact Horizontal Pipeline */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-11 gap-2">
          {lifecycleCounts.map((stage) => {
            const hasProblems = stage.count > 0;
            return (
              <div
                key={stage.key}
                className={`p-2.5 rounded border text-center transition ${
                  hasProblems
                    ? 'bg-blue-50/70 border-blue-300 text-slate-900 shadow-2xs'
                    : 'bg-slate-50/60 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                  <span className={hasProblems ? 'text-gov-navy' : 'text-slate-400'}>#{stage.order}</span>
                  <span className={`text-base font-black ${hasProblems ? 'text-blue-900' : 'text-slate-400'}`}>
                    {stage.count}
                  </span>
                </div>
                <div 
                  className={`text-xs font-semibold truncate ${hasProblems ? 'text-slate-900 font-bold' : 'text-slate-500'}`}
                  title={stage.label}
                >
                  {stage.label}
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {t(stage.label, stage.hindiLabel)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. UNIVERSITY ENGAGEMENT (Compact Comparison Table)                      */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-lg border border-slate-300 p-5 space-y-4 shadow-2xs">
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-gov-navy shrink-0" />
              <h3 className="gov-h3 text-gov-navy">
                {t('University Engagement', 'विश्वविद्यालय सहभागिता')}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {t(
                'Problems routed to participating institutions through AI expertise matching.',
                'एआई विशेषज्ञता मिलान के माध्यम से भाग लेने वाले संस्थानों को प्रेषित समस्याएं।'
              )}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-200 text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                <th className="p-3 font-semibold border-r border-slate-200">{t('Institution', 'संस्थान')}</th>
                <th className="p-3 font-semibold border-r border-slate-200 text-center">{t('Routed', 'प्रेषित')}</th>
                <th className="p-3 font-semibold border-r border-slate-200 text-center">{t('Adopted', 'स्वीकृत')}</th>
                <th className="p-3 font-semibold border-r border-slate-200 text-center">{t('In Development', 'समाधान विकास')}</th>
                <th className="p-3 font-semibold text-center">{t('Completed', 'पूर्ण')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {universityTableRows.map((u) => (
                <tr key={u.shortName} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-semibold text-slate-900 border-r border-slate-200">
                    <div>{u.institution}</div>
                    <div className="text-xs text-slate-500 font-normal">{u.shortName}</div>
                  </td>
                  <td className="p-3 text-center border-r border-slate-200 font-mono font-bold text-gov-navy">
                    {u.routed}
                  </td>
                  <td className="p-3 text-center border-r border-slate-200 font-mono font-bold text-indigo-950">
                    {u.adopted}
                  </td>
                  <td className="p-3 text-center border-r border-slate-200 font-mono font-bold text-amber-950">
                    {u.development}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-emerald-900">
                    {u.completed}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
                <td className="p-3 border-r border-slate-200">
                  {t('Total (All Institutions)', 'कुल (सभी संस्थान)')}
                </td>
                <td className="p-3 text-center border-r border-slate-200 font-mono">
                  {universityTotals.routed}
                </td>
                <td className="p-3 text-center border-r border-slate-200 font-mono">
                  {universityTotals.adopted}
                </td>
                <td className="p-3 text-center border-r border-slate-200 font-mono">
                  {universityTotals.development}
                </td>
                <td className="p-3 text-center font-mono text-emerald-950">
                  {universityTotals.completed}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. LOCATION INTELLIGENCE (Primary Table, Locality Table, Coordinates)      */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-lg border border-slate-300 p-5 space-y-4 shadow-2xs">
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-gov-navy shrink-0" />
              <h3 className="gov-h3 text-gov-navy">
                {t('Location Intelligence', 'स्थान विश्लेषिकी')}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {t(
                'District and locality distribution based on reported problem locations.',
                'दर्ज समस्या स्थानों के आधार पर ज़िला एवं इलाकावार वितरण।'
              )}
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300 self-start sm:self-auto">
            {reportsWithCoordinates.length} / {filteredProblems.length} GEOCODED
          </span>
        </div>

        {districtLocationSummary.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded border border-slate-200 text-center text-slate-600 text-sm">
            <div className="text-base font-semibold text-slate-700 mb-1">
              {t('No location data available for the selected reports.', 'चयनित रिपोर्टों के लिए कोई स्थान डेटा उपलब्ध नहीं है।')}
            </div>
            <p className="text-xs text-slate-500">
              {t('Try broadening the active filter criteria.', 'सक्रिय फ़िल्टर मानदंड को व्यापक बनाने का प्रयास करें।')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Primary View: District Summary Table */}
            <div>
              <div className="text-xs uppercase font-bold text-slate-700 tracking-wider mb-2">
                {t('District Location Summary', 'ज़िला स्थान सारांश')}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-200 text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                      <th className="p-3 font-semibold border-r border-slate-200">{t('District', 'ज़िला')}</th>
                      <th className="p-3 font-semibold border-r border-slate-200 text-center">{t('Reports', 'कुल रिपोर्ट')}</th>
                      <th className="p-3 font-semibold border-r border-slate-200 text-center">{t('Reports with Coordinates', 'निर्देशांक सहित रिपोर्ट')}</th>
                      <th className="p-3 font-semibold text-center">{t('Geocoded Coverage', 'जियोकोडेड कवरेज')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {districtLocationSummary.map(row => (
                      <tr key={row.district} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-semibold text-slate-900 border-r border-slate-200">
                          {row.district}
                        </td>
                        <td className="p-3 text-center border-r border-slate-200 font-mono font-bold text-gov-navy">
                          {row.totalReports}
                        </td>
                        <td className="p-3 text-center border-r border-slate-200 font-mono font-bold text-slate-800">
                          {row.withCoords}
                        </td>
                        <td className="p-3 text-center font-mono font-semibold text-slate-700">
                          {row.percentageGeocoded}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
                      <td className="p-3 border-r border-slate-200">
                        {t('Total', 'कुल')}
                      </td>
                      <td className="p-3 text-center border-r border-slate-200 font-mono">
                        {filteredProblems.length}
                      </td>
                      <td className="p-3 text-center border-r border-slate-200 font-mono">
                        {reportsWithCoordinates.length}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {filteredProblems.length > 0 ? Math.round((reportsWithCoordinates.length / filteredProblems.length) * 100) : 0}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Secondary View: Locality Table */}
            <div>
              <div className="text-xs uppercase font-bold text-slate-700 tracking-wider mb-2">
                {t('Locality Breakdown', 'इलाकावार विवरण')}
              </div>
              <div className="overflow-x-auto max-h-60 overflow-y-auto border border-slate-200 rounded">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 sticky top-0">
                      <th className="p-2.5 font-semibold border-r border-slate-200">{t('District', 'ज़िला')}</th>
                      <th className="p-2.5 font-semibold border-r border-slate-200">{t('Locality / Panchayat', 'इलाका / पंचायत')}</th>
                      <th className="p-2.5 font-semibold text-center">{t('Reports', 'रिपोर्ट संख्या')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localityDistribution.map((row) => (
                      <tr key={`${row.district}-${row.locality}`} className="hover:bg-slate-50 transition">
                        <td className="p-2.5 font-semibold text-slate-900 border-r border-slate-100">
                          {row.district}
                        </td>
                        <td className="p-2.5 text-slate-800 border-r border-slate-100">
                          {row.locality}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-gov-navy">
                          {row.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Secondary Expandable Control: Coordinates Registry */}
            {reportsWithCoordinates.length > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setIsCoordinatesExpanded(!isCoordinatesExpanded)}
                  className="w-full bg-slate-100 hover:bg-slate-200/80 px-4 py-3 flex items-center justify-between text-left transition"
                  aria-expanded={isCoordinatesExpanded}
                  aria-controls="geospatial-records-table"
                >
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gov-navy" />
                    <span className="text-sm font-bold text-gov-navy">
                      {t('Inspect Location Coordinates Registry (Read-Only)', 'स्थान निर्देशांक रजिस्ट्री देखें (केवल-पठन)')}
                    </span>
                    <span className="text-xs text-slate-600 font-mono">
                      ({reportsWithCoordinates.length} {t('geocoded records', 'जियोकोडेड रिकॉर्ड')})
                    </span>
                  </div>
                  {isCoordinatesExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  )}
                </button>

                {isCoordinatesExpanded && (
                  <div id="geospatial-records-table" className="p-4 bg-white overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold sticky top-0">
                          <th className="p-2.5 font-mono">{t('Problem ID', 'समस्या आईडी')}</th>
                          <th className="p-2.5">{t('District', 'ज़िला')}</th>
                          <th className="p-2.5">{t('Locality / Area', 'इलाका / क्षेत्र')}</th>
                          <th className="p-2.5 font-mono">{t('Latitude', 'अक्षांश')}</th>
                          <th className="p-2.5 font-mono">{t('Longitude', 'देशांतर')}</th>
                          <th className="p-2.5">{t('Current Stage', 'वर्तमान चरण')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportsWithCoordinates.map(report => (
                          <tr key={report.id} className="hover:bg-slate-50/70 transition">
                            <td className="p-2.5 font-mono font-bold text-gov-navy">{report.id}</td>
                            <td className="p-2.5 font-semibold text-slate-800">{report.district}</td>
                            <td className="p-2.5 text-slate-700">{report.panchayatOrLocality || 'N/A'}</td>
                            <td className="p-2.5 font-mono text-slate-600">
                              {report.coordinates.lat.toFixed(4)}° N
                            </td>
                            <td className="p-2.5 font-mono text-slate-600">
                              {report.coordinates.lng.toFixed(4)}° E
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 inline-block font-mono">
                                {report.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
