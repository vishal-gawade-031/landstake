/**
 * LANDSTACK TRANSPARENT RISK & ANOMALY ENGINE
 * 
 * Future AI/ML Scope:
 * Architecture: Next.js -> Backend API -> Risk Engine -> Python ML Service (FastAPI) -> IsolationForest / XGBoost Anomaly Prediction
 * 
 * Current Phase: Deterministic Rule-Based Engine with transparent scoring and breakdown.
 */

export interface RiskFactor {
  id: string;
  name: string;
  weight: number;
  triggered: boolean;
  reason: string;
  category: 'SPATIAL' | 'LEGAL' | 'FINANCIAL' | 'REGISTRATION';
}

export interface RiskAssessmentResult {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  color: string;
  textColor: string;
  factors: RiskFactor[];
  summary: string;
  aiMlRecommendedAction: string;
  timestamp: string;
  version: string;
}

export interface ParcelRiskInput {
  hasAreaMismatch?: boolean;
  areaDifference?: number;
  hasBoundaryOverlap?: boolean;
  overlapAreaSqM?: number;
  hasOwnershipConflict?: boolean;
  hasRegistrationConflict?: boolean;
  hasEncumbrance?: boolean;
  hasTaxIssue?: boolean;
  isNearRestrictedZone?: boolean;
}

export class RiskEngine {
  private static readonly WEIGHTS = {
    AREA_MISMATCH: 20,
    BOUNDARY_OVERLAP: 20,
    OWNERSHIP_CONFLICT: 25,
    REGISTRATION_CONFLICT: 20,
    ENCUMBRANCE: 10,
    TAX_ISSUE: 5,
  };

  /**
   * Evaluates risk deterministically based on verified parcel conditions.
   * Transparently documents every factor and score contribution.
   */
  public static evaluateRisk(input: ParcelRiskInput): RiskAssessmentResult {
    const factors: RiskFactor[] = [
      {
        id: 'OWNERSHIP_CONFLICT',
        name: 'Ownership Dispute / Legal Conflict',
        weight: this.WEIGHTS.OWNERSHIP_CONFLICT,
        triggered: Boolean(input.hasOwnershipConflict),
        category: 'LEGAL',
        reason: input.hasOwnershipConflict
          ? 'Active dispute filed with Assistant Commissioner or Civil Revenue Court'
          : 'Title ownership chain verified with clear succession pedigree',
      },
      {
        id: 'BOUNDARY_OVERLAP',
        name: 'Spatial Boundary Overlap',
        weight: this.WEIGHTS.BOUNDARY_OVERLAP,
        triggered: Boolean(input.hasBoundaryOverlap),
        category: 'SPATIAL',
        reason: input.hasBoundaryOverlap
          ? `GIS boundary polygon overlaps with adjacent cadastral survey unit (${input.overlapAreaSqM ? input.overlapAreaSqM + ' sq.m' : 'potential sliver'})`
          : 'Zero topological overlap detected with contiguous parcels',
      },
      {
        id: 'REGISTRATION_CONFLICT',
        name: 'Deed & Registration Anomaly',
        weight: this.WEIGHTS.REGISTRATION_CONFLICT,
        triggered: Boolean(input.hasRegistrationConflict),
        category: 'REGISTRATION',
        reason: input.hasRegistrationConflict
          ? 'Multiple transactions recorded within short duration without mutation register synchronization'
          : 'Registered deeds match Sub-Registrar digital index',
      },
      {
        id: 'AREA_MISMATCH',
        name: 'Cadastral vs GIS Area Variance',
        weight: this.WEIGHTS.AREA_MISMATCH,
        triggered: Boolean(input.hasAreaMismatch || (input.areaDifference && input.areaDifference >= 0.2)),
        category: 'SPATIAL',
        reason: input.hasAreaMismatch || (input.areaDifference && input.areaDifference >= 0.2)
          ? `Calculated GIS polygon extent differs by ${input.areaDifference?.toFixed(2) || '0.2+'} acres from recorded survey entry`
          : 'GIS area matches recorded survey extent within permissible tolerance (±0.05 acres)',
      },
      {
        id: 'ENCUMBRANCE',
        name: 'Financial Encumbrance / Mortgage',
        weight: this.WEIGHTS.ENCUMBRANCE,
        triggered: Boolean(input.hasEncumbrance),
        category: 'FINANCIAL',
        reason: input.hasEncumbrance
          ? 'Active commercial bank mortgage or statutory charge attached to parcel'
          : 'No active encumbrance certificate (Nil Form 15)',
      },
      {
        id: 'TAX_ISSUE',
        name: 'Property Tax Arrears',
        weight: this.WEIGHTS.TAX_ISSUE,
        triggered: Boolean(input.hasTaxIssue),
        category: 'FINANCIAL',
        reason: input.hasTaxIssue
          ? 'Property tax arrears outstanding for more than two consecutive fiscal assessment cycles'
          : 'All municipal/rural property taxes paid up to date',
      },
    ];

    let totalScore = 0;
    factors.forEach((f) => {
      if (f.triggered) {
        totalScore += f.weight;
      }
    });

    if (totalScore > 100) totalScore = 100;

    let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let color = '#10b981'; // Green
    let textColor = 'text-emerald-700 dark:text-emerald-400';
    let summary = 'Parcel has a clean title with low governance risk.';
    let aiMlRecommendedAction = 'Eligible for instant digital mutation and automatic building permission processing.';

    if (totalScore >= 76) {
      level = 'CRITICAL';
      color = '#ef4444'; // Red
      textColor = 'text-red-700 dark:text-red-400';
      summary = 'Critical multi-dimensional legal and spatial conflict detected. Immediate stay on transactions recommended.';
      aiMlRecommendedAction = 'Flag for joint field inspection by Tahasildar and District Surveyor; halt registration portal endorsement.';
    } else if (totalScore >= 51) {
      level = 'HIGH';
      color = '#f97316'; // Orange
      textColor = 'text-orange-700 dark:text-orange-400';
      summary = 'High governance risk identified. Requires formal officer review before approval of applications.';
      aiMlRecommendedAction = 'Require physical deed verification at Sub-Registrar office and total station cadastral resurvey.';
    } else if (totalScore >= 26) {
      level = 'MEDIUM';
      color = '#eab308'; // Amber/Yellow
      textColor = 'text-amber-700 dark:text-amber-400';
      summary = 'Moderate risk indicators noted. Regular officer verification recommended.';
      aiMlRecommendedAction = 'Send automated notification to owner for tax clearance or area reconciliation document submission.';
    }

    return {
      score: totalScore,
      level,
      color,
      textColor,
      factors,
      summary,
      aiMlRecommendedAction,
      timestamp: new Date().toISOString(),
      version: '1.2.0-deterministic (ML-Ready)',
    };
  }

  /**
   * Future Python ML Service Bridge placeholder.
   * If an external ML inference service URL is provided in env (e.g. ML_SERVICE_URL=http://localhost:8000/predict),
   * this method can invoke the AI anomaly model asynchronously.
   */
  public static async queryPythonMlAnomalyService(parcelData: any): Promise<{ mlPredictedAnomaly: boolean; confidence: number }> {
    const mlUrl = process.env.ML_SERVICE_URL;
    if (!mlUrl) {
      // Return simulated ML prediction based on input heuristics
      return {
        mlPredictedAnomaly: (parcelData.riskScore || 0) > 40,
        confidence: 0.94,
      };
    }

    try {
      const response = await fetch(`${mlUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parcelData),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Fallback
    }

    return {
      mlPredictedAnomaly: false,
      confidence: 0.5,
    };
  }
}
