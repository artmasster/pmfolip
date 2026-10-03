export type CategoryId =
  | 'economy'
  | 'fiscal'
  | 'trade'
  | 'education'
  | 'health'
  | 'equity'
  | 'infrastructure'
  | 'environment'
  | 'governance';

export interface Source {
  id: string;
  title: string;
  url: string;
}

export interface Term {
  id: string;
  start: string;
  end: string | null;
  label: string;
}

export interface Leader {
  id: string;
  ordinal: number;
  name: string;
  shortName: string;
  englishName: string;
  era: 'foundation' | 'development' | 'modern';
  terms: Term[];
  portrait: string | null;
  portraitCredit: { author: string; license: string; url: string } | null;
  summary: string;
  highlights: { title: string; detail: string; sourceUrl: string }[];
  sourceIds: string[];
}

export interface LeadersDataset {
  asOf: string;
  sources: Source[];
  leaders: Leader[];
}

export interface YearValue {
  year: number;
  value: number;
}

/** Describes observed periods, never a causal claim about the officeholder. */
export type MetricBasis = 'tenure' | 'single-year' | 'country-context' | 'none';

export interface Indicator {
  id: string;
  category: CategoryId;
  categoryLabel: string;
  name: string;
  description: string;
  unit: string;
  unitLabel: string;
  direction: 'higher' | 'lower' | 'context';
  source: { title: string; url: string; code: string; apiUrl?: string; lastUpdated?: string };
  values: YearValue[];
  benchmark?: YearValue[];
  uncertainty?: { year: number; lower: number; upper: number }[];
  uncertaintyLevel?: number;
  uncertaintyDescription?: string;
  /** Alternative series for the same concept contribute at most once per category. */
  scoreFamily?: string;
  /** Higher priorities are preferred among available members of one family. */
  scorePriority?: number;
  notes: string;
  scorable: boolean;
}

export interface IndicatorsDataset {
  asOf: string;
  indicators: Indicator[];
}

export interface CategoryMetadata {
  id: CategoryId;
  label: string;
  shortLabel: string;
  description: string;
}

export interface MetricResult {
  indicator: Indicator;
  average: number | null;
  score: number | null;
  basis: MetricBasis;
  usedInCategory: boolean;
  sampleCount: number;
  years: number[];
  values: YearValue[];
  /** Observed eligible years / all eligible years, from 0 to 1. */
  coverage: number;
  firstValue: number | null;
  lastValue: number | null;
  /** Last observed value minus first observed value; not a policy effect. */
  change: number | null;
  /** Only populated when benchmark observations cover exactly the same years. */
  benchmarkAverage: number | null;
  reason: string | null;
}

export interface CategoryResult {
  id: CategoryId;
  label: string;
  score: number | null;
  basis: MetricBasis;
  scoreMetricIds: string[];
  metricCount: number;
  scoredMetricCount: number;
  metrics: MetricResult[];
}

export interface LeaderMetrics {
  leader: Leader;
  termId?: string;
  termLabel: string;
  assignedYears: number[];
  /** Completed calendar years with any term overlap, only used without majority years. */
  contextYears: number[];
  usedYears: number[];
  basis: MetricBasis;
  metrics: MetricResult[];
  categories: CategoryResult[];
  scoredCategoryCount: number;
}

export interface MetricComparison {
  indicator: Indicator;
  left: MetricResult;
  right: MetricResult;
  /** Both selections have at least one actual annual observation of this same series. */
  comparable: boolean;
  difference: number | null;
  /** Raw direction only for multiple observed majority years on both sides; never a verdict. */
  favorable: 'left' | 'right' | 'tie' | null;
}

export interface CategoryComparison {
  id: CategoryId;
  label: string;
  leftScore: number | null;
  rightScore: number | null;
  leftBasis: MetricBasis;
  rightBasis: MetricBasis;
  /** Category comparison uses only indicators scored for both selections. */
  sharedMetricCount: number;
  metricIds: string[];
}

export interface ComparisonResult {
  left: LeaderMetrics;
  right: LeaderMetrics;
  metrics: MetricComparison[];
  categories: CategoryComparison[];
}
