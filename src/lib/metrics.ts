import type {
  CategoryMetadata,
  ComparisonResult,
  Indicator,
  Leader,
  LeaderMetrics,
  MetricBasis,
  MetricResult,
  Term,
  YearValue,
} from '../types';

/** A fixed data snapshot; never count the still-incomplete current calendar year. */
export const DATA_AS_OF = '2026-10-03';
const DAY = 86_400_000;

export const categories: CategoryMetadata[] = [
  { id: 'economy', label: 'เศรษฐกิจและรายได้', shortLabel: 'เศรษฐกิจ', description: 'การเติบโตของเศรษฐกิจและรายได้ต่อคน' },
  { id: 'fiscal', label: 'การคลัง', shortLabel: 'การคลัง', description: 'รายได้รัฐและภาระหนี้ พร้อมบริบทของแต่ละช่วงเวลา' },
  { id: 'trade', label: 'การค้า', shortLabel: 'การค้า', description: 'การเติบโตของการส่งออกสินค้าและบริการ' },
  { id: 'education', label: 'การศึกษา', shortLabel: 'การศึกษา', description: 'การเข้าถึงและระดับการศึกษาที่สำเร็จ ไม่ใช่คะแนนคุณภาพการเรียนรู้' },
  { id: 'health', label: 'สุขภาพ', shortLabel: 'สุขภาพ', description: 'อายุขัยและโอกาสรอดชีวิตของประชาชน' },
  { id: 'equity', label: 'ความเหลื่อมล้ำ', shortLabel: 'ความเหลื่อมล้ำ', description: 'การกระจายรายได้และความยากจน' },
  { id: 'infrastructure', label: 'โครงสร้างพื้นฐาน', shortLabel: 'โครงสร้างพื้นฐาน', description: 'การเข้าถึงบริการพื้นฐานและการเชื่อมต่อ' },
  { id: 'environment', label: 'สิ่งแวดล้อม', shortLabel: 'สิ่งแวดล้อม', description: 'มลพิษและผลกระทบต่อสิ่งแวดล้อม' },
  { id: 'governance', label: 'ธรรมาภิบาลและสิทธิ', shortLabel: 'ธรรมาภิบาล', description: 'สิทธิ การมีส่วนร่วม และการควบคุมการทุจริต' },
];

function parseDate(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const stamp = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(stamp)) return null;
  return new Date(stamp).toISOString().slice(0, 10) === value ? stamp : null;
}

function snapshot(asOf: string): { stamp: number; year: number } {
  const stamp = parseDate(asOf);
  if (stamp === null) throw new Error('asOf ต้องเป็นวันที่จริงในรูป YYYY-MM-DD');
  return { stamp, year: new Date(stamp).getUTCFullYear() };
}

/** Merge overlaps before counting so adjacent/repeated terms never double-count days. */
function occupiedDays(terms: Term[], year: number, asOfStamp: number): number {
  const yearStart = Date.UTC(year, 0, 1);
  const yearEnd = Date.UTC(year + 1, 0, 1);
  const intervals: [number, number][] = [];
  for (const term of terms) {
    const start = parseDate(term.start);
    const end = term.end === null ? asOfStamp : parseDate(term.end);
    if (start === null || end === null || end <= start) continue;
    const lower = Math.max(start, yearStart);
    // Appointment day belongs to the incoming term: intervals are [start, end).
    const upper = Math.min(end, yearEnd, asOfStamp);
    if (upper > lower) intervals.push([lower, upper]);
  }
  intervals.sort((a, b) => a[0] - b[0]);
  let total = 0;
  let active: [number, number] | undefined;
  for (const interval of intervals) {
    if (!active) active = [...interval];
    else if (interval[0] <= active[1]) active[1] = Math.max(active[1], interval[1]);
    else {
      total += active[1] - active[0];
      active = [...interval];
    }
  }
  if (active) total += active[1] - active[0];
  return total / DAY;
}

export function getAssignedYears(
  leader: Leader,
  allLeaders: Leader[],
  termId?: string,
  asOf = DATA_AS_OF,
): number[] {
  const now = snapshot(asOf);
  const terms = termId ? leader.terms.filter((term) => term.id === termId) : leader.terms;
  const starts = terms.map((term) => parseDate(term.start)).filter((date): date is number => date !== null);
  if (!starts.length) return [];
  const firstYear = new Date(Math.min(...starts)).getUTCFullYear();
  const years: number[] = [];
  for (let year = firstYear; year < now.year; year += 1) {
    const daysInYear = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / DAY;
    if (occupiedDays(terms, year, now.stamp) <= daysInYear / 2) continue;
    // A conflicting majority is a registry error, never permission to credit both.
    const conflict = allLeaders.some((other) => other.id !== leader.id
      && occupiedDays(other.terms, year, now.stamp) > daysInYear / 2);
    if (!conflict) years.push(year);
  }
  return years;
}

/** Annual country context is not attributed to the short-tenure officeholder. */
export function getContextYears(
  leader: Leader,
  _allLeaders: Leader[],
  termId?: string,
  asOf = DATA_AS_OF,
): number[] {
  const now = snapshot(asOf);
  const terms = termId ? leader.terms.filter((term) => term.id === termId) : leader.terms;
  const starts = terms.map((term) => parseDate(term.start)).filter((date): date is number => date !== null);
  if (!starts.length) return [];
  const firstYear = new Date(Math.min(...starts)).getUTCFullYear();
  const years: number[] = [];
  for (let year = firstYear; year < now.year; year += 1) {
    if (occupiedDays(terms, year, now.stamp) >= 1) years.push(year);
  }
  return years;
}

export function getMetricBasisLabel(basis: MetricBasis): string {
  return {
    tenure: 'หลายปีในวาระ',
    'single-year': 'ข้อมูลปีเดียว',
    'country-context': 'บริบทประเทศ',
    none: 'ไม่มีข้อมูล',
  }[basis];
}

/** Ignore missing/nonfinite observations; contradictory duplicate years stay unknown. */
function observations(values: YearValue[], beforeYear: number): YearValue[] {
  const byYear = new Map<number, number>();
  const conflicts = new Set<number>();
  for (const item of values) {
    if (!Number.isInteger(item.year) || item.year >= beforeYear || !Number.isFinite(item.value)) continue;
    if (byYear.has(item.year) && byYear.get(item.year) !== item.value) conflicts.add(item.year);
    else byYear.set(item.year, item.value);
  }
  return [...byYear.entries()]
    .filter(([year]) => !conflicts.has(year))
    .sort(([left], [right]) => left - right)
    .map(([year, value]) => ({ year, value }));
}

function mean(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

/** Empirical midrank percentile of the tenure mean in Thailand's observed annual values. */
export function percentileScore(value: number, reference: number[], direction: 'higher' | 'lower'): number | null {
  const finite = reference.filter(Number.isFinite);
  if (!Number.isFinite(value) || finite.length < 2) return null;
  const below = finite.filter((point) => point < value).length;
  const equal = finite.filter((point) => point === value).length;
  const percentile = ((below + equal / 2) / finite.length) * 100;
  return direction === 'lower' ? 100 - percentile : percentile;
}

function getMetric(
  indicator: Indicator,
  usedYears: number[],
  beforeYear: number,
  countryContext: boolean,
): MetricResult {
  const reference = observations(indicator.values, beforeYear);
  const eligible = new Set(usedYears);
  const values = reference.filter((point) => eligible.has(point.year));
  const years = values.map((point) => point.year);
  const average = mean(values.map((point) => point.value));
  const firstValue = values[0]?.value ?? null;
  const lastValue = values.at(-1)?.value ?? null;
  let score: number | null = null;
  let reason: string | null = null;
  const basis: MetricBasis = !values.length ? 'none' : countryContext ? 'country-context'
    : values.length === 1 ? 'single-year' : 'tenure';
  if (!usedYears.length) reason = 'ยังไม่มีปีปฏิทินที่สิ้นสุดแล้วในช่วงดำรงตำแหน่ง';
  else if (average === null) reason = 'ไม่มีข้อมูลในปีที่เข้าเกณฑ์';
  else if (!indicator.scorable || indicator.direction === 'context') reason = 'แสดงเป็นข้อมูลบริบท ไม่แปลงเป็นคะแนน';
  else {
    score = percentileScore(average, reference.map((point) => point.value), indicator.direction);
    if (score === null) reason = 'ชุดข้อมูลอ้างอิงมีน้อยกว่า 2 ปี ไม่พอคำนวณ percentile';
    else if (countryContext) reason = 'บริบทประเทศในปีที่ดำรงตำแหน่ง ไม่ใช่ผลลัพธ์เฉพาะวาระ';
    else if (values.length === 1) reason = 'ดัชนีจากข้อมูลจริงเพียง 1 ปี ยังใช้สรุปแนวโน้มไม่ได้';
  }
  const benchmark = observations(indicator.benchmark ?? [], beforeYear)
    .filter((point) => years.includes(point.year));
  return {
    indicator,
    average,
    score,
    basis,
    usedInCategory: false,
    sampleCount: values.length,
    years,
    values,
    coverage: usedYears.length ? values.length / usedYears.length : 0,
    firstValue,
    lastValue,
    change: values.length >= 2 && lastValue !== null && firstValue !== null ? lastValue - firstValue : null,
    benchmarkAverage: values.length > 0 && benchmark.length === values.length
      ? mean(benchmark.map((point) => point.value)) : null,
    reason,
  };
}

/** Retain the least certain temporal basis represented by the selected observations. */
function combinedBasis(metrics: MetricResult[]): MetricBasis {
  const bases = metrics.map((metric) => metric.basis).filter((basis) => basis !== 'none');
  if (bases.includes('country-context')) return 'country-context';
  if (bases.includes('single-year')) return 'single-year';
  return bases.length ? 'tenure' : 'none';
}

/** Pick an entire source series per concept, without joining values from different sources. */
function preferredFamilies<T extends { indicator: Indicator }>(metrics: T[]): T[] {
  const sorted = [...metrics].sort((left, right) => {
    const leftPriority = Number.isFinite(left.indicator.scorePriority) ? left.indicator.scorePriority! : 0;
    const rightPriority = Number.isFinite(right.indicator.scorePriority) ? right.indicator.scorePriority! : 0;
    return rightPriority - leftPriority
      || (left.indicator.id < right.indicator.id ? -1 : left.indicator.id > right.indicator.id ? 1 : 0);
  });
  const chosen = new Map<string, T>();
  for (const metric of sorted) {
    const family = metric.indicator.scoreFamily || metric.indicator.id;
    if (!chosen.has(family)) chosen.set(family, metric);
  }
  return [...chosen.values()];
}

export function getLeaderMetrics(
  leader: Leader,
  indicators: Indicator[],
  allLeaders: Leader[],
  termId?: string,
  asOf = DATA_AS_OF,
): LeaderMetrics {
  const now = snapshot(asOf);
  const assignedYears = getAssignedYears(leader, allLeaders, termId, asOf);
  const contextYears = assignedYears.length ? [] : getContextYears(leader, allLeaders, termId, asOf);
  const usedYears = assignedYears.length ? assignedYears : contextYears;
  const metrics = indicators.map((indicator) => getMetric(indicator, usedYears, now.year, !assignedYears.length));
  const categoryResults = categories.map((category) => {
    const matching = metrics.filter((metric) => metric.indicator.category === category.id);
    const chosen = preferredFamilies(matching.filter((metric) => metric.score !== null));
    for (const metric of chosen) metric.usedInCategory = true;
    const scores = chosen.map((metric) => metric.score as number);
    return {
      id: category.id,
      label: category.label,
      score: mean(scores),
      basis: combinedBasis(chosen),
      scoreMetricIds: chosen.map((metric) => metric.indicator.id),
      metricCount: matching.length,
      scoredMetricCount: scores.length,
      metrics: matching,
    };
  });
  return {
    leader,
    termId,
    termLabel: termId ? leader.terms.find((term) => term.id === termId)?.label ?? 'ไม่พบวาระนี้' : 'ทุกวาระ',
    assignedYears,
    contextYears,
    usedYears,
    basis: combinedBasis(metrics.filter((metric) => metric.usedInCategory).length
      ? metrics.filter((metric) => metric.usedInCategory) : metrics),
    metrics,
    categories: categoryResults,
    scoredCategoryCount: categoryResults.filter((category) => category.score !== null).length,
  };
}

export function getComparison(
  left: Leader,
  right: Leader,
  indicators: Indicator[],
  allLeaders: Leader[],
  leftTermId?: string,
  rightTermId?: string,
  asOf = DATA_AS_OF,
): ComparisonResult {
  const leftResults = getLeaderMetrics(left, indicators, allLeaders, leftTermId, asOf);
  const rightResults = getLeaderMetrics(right, indicators, allLeaders, rightTermId, asOf);
  const metrics = indicators.map((indicator, index) => {
    const leftMetric = leftResults.metrics[index];
    const rightMetric = rightResults.metrics[index];
    const comparable = leftMetric.sampleCount >= 1 && rightMetric.sampleCount >= 1;
    const difference = comparable && leftMetric.average !== null && rightMetric.average !== null
      ? leftMetric.average - rightMetric.average : null;
    let favorable: 'left' | 'right' | 'tie' | null = null;
    if (difference !== null && indicator.scorable && indicator.direction !== 'context'
      && leftMetric.basis === 'tenure' && rightMetric.basis === 'tenure') {
      if (Math.abs(difference) < 1e-10) favorable = 'tie';
      else if (indicator.direction === 'higher') favorable = difference > 0 ? 'left' : 'right';
      else favorable = difference < 0 ? 'left' : 'right';
    }
    return { indicator, left: leftMetric, right: rightMetric, comparable, difference, favorable };
  });
  const categoryResults = categories.map((category) => {
    const shared = preferredFamilies(metrics.filter((metric) => metric.indicator.category === category.id
      && metric.left.score !== null && metric.right.score !== null));
    return {
      id: category.id,
      label: category.label,
      leftScore: mean(shared.map((metric) => metric.left.score as number)),
      rightScore: mean(shared.map((metric) => metric.right.score as number)),
      leftBasis: combinedBasis(shared.map((metric) => metric.left)),
      rightBasis: combinedBasis(shared.map((metric) => metric.right)),
      sharedMetricCount: shared.length,
      metricIds: shared.map((metric) => metric.indicator.id),
    };
  });
  return { left: leftResults, right: rightResults, metrics, categories: categoryResults };
}

export function formatValue(value: number | null, indicator?: Indicator, withUnit = false): string {
  if (value === null || !Number.isFinite(value)) return 'ไม่มีข้อมูล';
  const formatted = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(value);
  return withUnit && indicator ? `${formatted} ${indicator.unitLabel}` : formatted;
}

export function formatScore(score: number | null): string {
  return score === null || !Number.isFinite(score) ? '—' : String(Math.round(score));
}

/** Compact actual years, preserving gaps instead of implying continuous coverage. */
export function formatYears(years: number[]): string {
  const unique = [...new Set(years.filter(Number.isInteger))].sort((a, b) => a - b);
  if (!unique.length) return 'ไม่มีปีที่เข้าเกณฑ์';
  const ranges: string[] = [];
  let start = unique[0];
  let end = start;
  for (const year of unique.slice(1)) {
    if (year === end + 1) end = year;
    else {
      ranges.push(start === end ? String(start) : `${start}–${end}`);
      start = end = year;
    }
  }
  ranges.push(start === end ? String(start) : `${start}–${end}`);
  return ranges.join(', ');
}
