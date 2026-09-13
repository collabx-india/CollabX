import { AIProblemAnalysis, AIScores, Challenge, IndustryPartner, ProblemReport, SecondaryMatchInfo } from '../types';
import { ALL_DEPARTMENTS, DepartmentCapability } from '../data/universityDepartments';

export class AIEngineService {
  /**
   * Deterministic & Explainable AI Problem Analyzer with Dynamic Department Matching:
   * Classifies civic reports, calculates dynamic capability match score,
   * automatically routes to the most suitable University Department, and builds explainable reasons.
   */
  static analyzeProblem(
    title: string,
    description: string,
    locality: string,
    existingProblems: ProblemReport[] = []
  ): AIProblemAnalysis {
    const text = `${title} ${description} ${locality}`.toLowerCase();

    let category = 'Urban Infrastructure & Public Works';
    let severity = 65;
    let priority: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
    const affectedGroups: string[] = ['Local residents', 'Commuters'];
    let rationale = 'Routine civic grievance requiring municipal works inspection.';
    let requiredSkills: string[] = ['Civil Engineering', 'Public Infrastructure Assessment'];

    if (
      text.includes('water') && (text.includes('drink') || text.includes('contaminat') || text.includes('pollut') || text.includes('toxic') || text.includes('well') || text.includes('purif') || text.includes('arsenic') || text.includes('fluoride'))
    ) {
      category = 'Water Quality & Environmental Health';
      severity = 90;
      priority = 'Critical';
      affectedGroups.push('School children', 'Households', 'Rural hamlets');
      rationale = 'Severe public health risk: Contaminated drinking water sources cause acute water-borne illnesses and vector risks.';
      requiredSkills = ['Environmental Engineering', 'Water Quality Testing', 'Pollution Monitoring', 'IoT Sensors'];
    } else if (
      text.includes('water') ||
      text.includes('flood') ||
      text.includes('monsoon') ||
      text.includes('drain') ||
      text.includes('culvert') ||
      text.includes('nullah') ||
      text.includes('waterlog') ||
      text.includes('submerged')
    ) {
      category = 'Disaster Management & Urban Drainage';
      severity = 86;
      priority = 'High';
      affectedGroups.push('School children', 'Daily commuters', 'Local market vendors');
      rationale = 'High monsoonal severity: Recurrent drainage choking causes road cut-offs and vector-borne public health risks.';
      requiredSkills = ['Hydraulics & Drainage', 'Stormwater Management', 'Civil Engineering', 'Telemetry Transmitters'];
    } else if (
      text.includes('mining') ||
      text.includes('mine') ||
      text.includes('quarry') ||
      text.includes('dust') ||
      text.includes('overburden') ||
      text.includes('blasting') ||
      text.includes('tailings')
    ) {
      category = 'Mining Safety & Industrial Pollution';
      severity = 88;
      priority = 'High';
      affectedGroups.push('Mining vicinity villages', 'Miners', 'Local tribal communities');
      rationale = 'Industrial hazard: Mining fugitive dust and tailings destabilization directly impact ambient air quality and nearby village ecology.';
      requiredSkills = ['Mining Safety', 'Air Quality Monitoring', 'Mine Monitoring', 'Environmental Assessment'];
    } else if (
      text.includes('farm') ||
      text.includes('irrigation') ||
      text.includes('crop') ||
      text.includes('soil') ||
      text.includes('farmer') ||
      text.includes('paddy') ||
      text.includes('agriculture') ||
      text.includes('riverbank') ||
      text.includes('bund') ||
      text.includes('erosion')
    ) {
      category = 'Agriculture & Soil-Water Conservation';
      severity = 78;
      priority = 'High';
      affectedGroups.push('Smallholder farmers', 'Agrarian households', 'Tribal farmers');
      rationale = 'Agrarian priority: Soil moisture deficits and riverbank soil breaches jeopardize productive yields and community protection bunds.';
      requiredSkills = ['Agricultural Automation', 'Soil & Water Engineering', 'Precision Irrigation', 'Bio-Geotextiles'];
    } else if (
      text.includes('pothole') ||
      text.includes('road') ||
      text.includes('highway') ||
      text.includes('nh-') ||
      text.includes('pavement') ||
      text.includes('bridge') ||
      text.includes('transit') ||
      text.includes('traffic')
    ) {
      category = 'Transportation & Highway Infrastructure';
      severity = 82;
      priority = 'High';
      affectedGroups.push('Commuters', 'Public transit users', 'Emergency ambulances');
      rationale = 'Transportation safety: Severe road surface damage and potholes create major vehicular accident risks on arterial corridors.';
      requiredSkills = ['Highway Pavement Design', 'Computer Vision', 'Civil Engineering', 'Infrastructure Repair'];
    } else if (
      text.includes('waste') ||
      text.includes('garbage') ||
      text.includes('dump') ||
      text.includes('collection') ||
      text.includes('sanitation')
    ) {
      category = 'Waste Management & Smart Civic Services';
      severity = 72;
      priority = 'Medium';
      affectedGroups.push('Ward residents', 'Sanitation workers');
      rationale = 'Municipal sanitation challenge: Irregular waste collection causes public health deterioration and visual blights.';
      requiredSkills = ['AI/ML Route Optimization', 'IoT Sensors', 'Smart City IT', 'Data Analytics'];
    } else if (
      text.includes('power') ||
      text.includes('wire') ||
      text.includes('transformer') ||
      text.includes('electricity') ||
      text.includes('grid')
    ) {
      category = 'Energy & Power Distribution';
      severity = 74;
      priority = 'High';
      affectedGroups.push('Households', 'Commercial shops');
      rationale = 'Public safety risk: Exposed electrical infrastructure and transformer overloads risk power cutoffs and fires.';
      requiredSkills = ['Power Distribution', 'Smart Grid Safety', 'Electrical Engineering'];
    }

    // Duplicate Detection Logic
    let duplicateSimilarity = 12;
    let duplicateCandidateId: string | undefined;
    let duplicateCandidateTitle: string | undefined;

    for (const p of existingProblems) {
      const pText = `${p.title} ${p.description} ${p.panchayatOrLocality}`.toLowerCase();
      let matchCount = 0;
      const keywords = ['drain', 'water', 'flood', 'culvert', 'monsoon', 'nullah', 'pothole', 'mining', 'dust', 'irrigation', 'waste', 'soil'];
      
      keywords.forEach(kw => {
        if (text.includes(kw) && pText.includes(kw)) {
          matchCount++;
        }
      });

      if (matchCount >= 3) {
        duplicateSimilarity = Math.min(94, 60 + matchCount * 8);
        duplicateCandidateId = p.id;
        duplicateCandidateTitle = p.title;
        break;
      }
    }

    // Dynamic University Department Capability Matching (No hardcoded scores)
    interface ScoredDept {
      dept: DepartmentCapability;
      dynamicScore: number;
      matchedKeywords: string[];
      matchedSkills: string[];
    }

    const scoredDepartments: ScoredDept[] = ALL_DEPARTMENTS.map(dept => {
      let matchHits = 0;
      const matchedKeywords: string[] = [];
      const matchedSkills: string[] = [];

      // Keyword hits
      dept.keywords.forEach(kw => {
        if (text.includes(kw)) {
          matchHits += 3;
          if (!matchedKeywords.includes(kw)) matchedKeywords.push(kw);
        }
      });

      // Domain hits
      dept.domains.forEach(d => {
        const dLow = d.toLowerCase();
        if (text.includes(dLow) || category.toLowerCase().includes(dLow.split(' ')[0])) {
          matchHits += 4;
        }
      });

      // Capability hits
      dept.capabilities.forEach(cap => {
        const capWords = cap.toLowerCase().split(/\s+/);
        const overlap = capWords.filter(w => w.length > 3 && text.includes(w));
        if (overlap.length > 0) {
          matchHits += overlap.length * 2;
          if (!matchedSkills.includes(cap)) matchedSkills.push(cap);
        }
      });

      // Skills required overlap
      requiredSkills.forEach(skill => {
        const skillLow = skill.toLowerCase();
        dept.skills.forEach(deptSkill => {
          if (deptSkill.toLowerCase().includes(skillLow.split(' ')[0])) {
            matchHits += 3;
            if (!matchedSkills.includes(deptSkill)) matchedSkills.push(deptSkill);
          }
        });
      });

      // Specific district/locality affinity
      if (locality.toLowerCase().includes('dhanbad') && dept.universityId === 'iit-ism-dhanbad') matchHits += 2;
      if (locality.toLowerCase().includes('jamshedpur') && dept.universityId === 'nit-jamshedpur') matchHits += 2;
      if (locality.toLowerCase().includes('ranchi') && (dept.universityId === 'bit-mesra' || dept.universityId === 'bau-ranchi')) matchHits += 2;

      // Dynamic score calculation:
      // Base score 60 + dynamic scaling from matchHits, capped at 96%
      const dynamicScore = Math.min(96, Math.max(55, Math.round(62 + matchHits * 2.8)));

      return {
        dept,
        dynamicScore,
        matchedKeywords,
        matchedSkills
      };
    });

    // Sort by dynamic score descending
    scoredDepartments.sort((a, b) => b.dynamicScore - a.dynamicScore);

    const primary = scoredDepartments[0];
    const secondaryList = scoredDepartments.slice(1, 3);

    // Explainable reasoning checklist
    const primarySkills = primary.matchedSkills.slice(0, 2);
    const primaryKeywords = primary.matchedKeywords.slice(0, 2);
    const explanationBullets: string[] = [
      `${primary.dept.departmentName} capability alignment`,
      primarySkills[0] ? `${primarySkills[0]} expertise` : `${primary.dept.capabilities[0]} capability`,
      primarySkills[1] ? `${primarySkills[1]} competency` : `${primary.dept.skills[0]} research domain`,
      primaryKeywords[0] ? `Strong domain relevance to ${primaryKeywords.join(' & ')}` : `State-level R&D infrastructure in ${primary.dept.domains[0]}`
    ];

    const matchingReason = `Dynamic match score of ${primary.dynamicScore}%: High domain alignment between report requirements and ${primary.dept.universityName}'s ${primary.dept.departmentName} faculty expertise in ${primary.dept.domains.slice(0, 2).join(' and ')}.`;

    const secondaryMatches: SecondaryMatchInfo[] = secondaryList.map(item => ({
      universityId: item.dept.universityId,
      universityName: item.dept.universityName,
      departmentId: item.dept.id,
      departmentName: item.dept.departmentName,
      score: item.dynamicScore,
      reason: `Relevant ${item.dept.domains[0]} capabilities and technical support capacity.`
    }));

    return {
      category,
      severity,
      priority,
      duplicateSimilarity,
      duplicateCandidateId,
      duplicateCandidateTitle,
      affectedGroups,
      requiredSkills,
      matchedUniversities: [primary.dept.universityName, secondaryList[0]?.dept.universityName].filter(Boolean),
      matchedUniversity: primary.dept.universityName,
      matchedUniversityId: primary.dept.universityId,
      matchedDepartment: primary.dept.departmentName,
      matchedDepartmentId: primary.dept.id,
      matchingScore: primary.dynamicScore,
      matchingReason,
      matchingExplanationBullets: explanationBullets,
      secondaryMatches,
      confidence: Math.round(primary.dynamicScore) / 100,
      rationale,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Deterministic AI Idea Evaluator for proposals
   */
  static evaluateIdea(
    problemUnderstanding: string,
    proposedSolution: string,
    techStack: string[],
    estimatedCost: number
  ): AIScores {
    const combined = `${problemUnderstanding} ${proposedSolution} ${techStack.join(' ')}`.toLowerCase();

    let feasibility = 80;
    let socialImpact = 82;
    let costEfficiency = 80;
    let scalability = 80;
    let sustainability = 80;
    let technicalSuitability = 82;
    let aiRemarks = 'Viable GovTech proposal with balanced operational parameters.';

    if (combined.includes('siphon') || combined.includes('gravity')) {
      feasibility += 8;
      sustainability += 7;
      aiRemarks = 'Strong passive hydraulic mechanism reduces energy dependency during storm outages.';
    }

    if (combined.includes('iot') || combined.includes('sensor') || combined.includes('lora')) {
      technicalSuitability += 8;
      scalability += 6;
    }

    if (combined.includes('drone') || combined.includes('robot')) {
      technicalSuitability += 5;
      feasibility -= 7;
      costEfficiency -= 12;
      aiRemarks = 'High-tech proposal; capital expenditure and field maintenance considerations apply.';
    }

    if (estimatedCost > 500000) {
      costEfficiency -= 14;
    } else if (estimatedCost < 400000) {
      costEfficiency += 8;
    }

    if (combined.includes('resident') || combined.includes('school') || combined.includes('bypass') || combined.includes('village')) {
      socialImpact += 9;
    }

    const clamp = (val: number) => Math.max(50, Math.min(98, val));

    feasibility = clamp(feasibility);
    socialImpact = clamp(socialImpact);
    costEfficiency = clamp(costEfficiency);
    scalability = clamp(scalability);
    sustainability = clamp(sustainability);
    technicalSuitability = clamp(technicalSuitability);

    const compositeScore = Math.round(
      feasibility * 0.25 +
      socialImpact * 0.25 +
      costEfficiency * 0.15 +
      scalability * 0.15 +
      sustainability * 0.10 +
      technicalSuitability * 0.10
    );

    return {
      feasibility,
      socialImpact,
      costEfficiency,
      scalability,
      sustainability,
      technicalSuitability,
      compositeScore,
      aiRemarks,
    };
  }

  /**
   * Calculate industry partner match dynamically
   */
  static calculateIndustryMatch(challenge: Challenge, partner: IndustryPartner): number {
    let score = 70;
    const challengeText = `${challenge.domain} ${challenge.skillsRequired?.join(' ') || ''} ${challenge.summary}`.toLowerCase();

    partner.technologies.forEach(t => {
      if (challengeText.includes(t.toLowerCase().split(' ')[0])) score += 6;
    });

    partner.capabilities.forEach(c => {
      if (challengeText.includes(c.toLowerCase().split(' ')[0])) score += 5;
    });

    if (partner.location.toLowerCase().includes(challenge.district.toLowerCase())) {
      score += 8;
    }

    return Math.min(96, Math.max(65, score));
  }
}
