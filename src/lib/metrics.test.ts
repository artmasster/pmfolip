import { describe, expect, it } from 'vitest';
import type { Indicator, IndicatorsDataset, Leader, LeadersDataset, Term } from '../types';
import { indicatorSnapshot } from '../data/catalog';
import leaderSnapshot from '../data/leaders.json';
import {
  formatScore,
  formatValue,
  formatYears,
  getAssignedYears,
  getComparison,
  getContextYears,
  getLeaderMetrics,
  getMetricBasisLabel,
  percentileScore,
} from './metrics';

function term(id: string, start: string, end: string | null): Term {
  return { id, start, end, label: id };
}

function leader(id: string, terms: Term[]): Leader {
  return {
    id, ordinal: 1, name: id, shortName: id, englishName: id, era: 'modern', terms,
    portrait: null, portraitCredit: null, summary: '', highlights: [], sourceIds: [],
  };
}

function indicator(overrides: Partial<Indicator> = {}): Indicator {
  return {
    id: 'growth', category: 'economy', categoryLabel: 'เศรษฐกิจ', name: 'GDP growth',
    description: '', unit: '%', unitLabel: '% ต่อปี', direction: 'higher',
    source: { title: 'Source', url: 'https://example.org/data', code: 'TEST' },
    values: [{ year: 2018, value: -4 }, { year: 2019, value: 0 }, { year: 2020, value: 2 }, { year: 2021, value: 6 }],
    notes: '', scorable: true, ...overrides,
  };
}

describe('calendar-year attribution', () => {
  it('assigns only a strict majority, not the largest share among several leaders', () => {
    const first = leader('first', [term('a', '2021-01-01', '2021-05-10')]);
    const second = leader('second', [term('b', '2021-05-10', '2021-09-15')]);
    const third = leader('third', [term('c', '2021-09-15', '2022-01-01')]);
    const registry = [first, second, third];
    expect(registry.map((item) => getAssignedYears(item, registry))).toEqual([[], [], []]);
  });

  it('handles leap years, exact half-years, and exclusive handover dates', () => {
    const first = leader('first', [term('a', '2020-01-01', '2020-07-02')]);
    const second = leader('second', [term('b', '2020-07-02', '2021-01-01')]);
    expect(getAssignedYears(first, [first, second])).toEqual([]);
    expect(getAssignedYears(second, [first, second])).toEqual([]);

    const longerFirst = leader('first', [term('a', '2020-01-01', '2020-07-03')]);
    const shorterSecond = leader('second', [term('b', '2020-07-03', '2021-01-01')]);
    expect(getAssignedYears(longerFirst, [longerFirst, shorterSecond])).toEqual([2020]);
    expect(getAssignedYears(shorterSecond, [longerFirst, shorterSecond])).toEqual([]);
  });

  it('gives a normal-year handover to its one majority holder', () => {
    const first = leader('first', [term('a', '2021-01-01', '2021-07-03')]);
    const second = leader('second', [term('b', '2021-07-03', '2022-01-01')]);
    expect(getAssignedYears(first, [first, second])).toEqual([2021]);
    expect(getAssignedYears(second, [first, second])).toEqual([]);
  });

  it('never counts the current incomplete year or a future year', () => {
    const current = leader('current', [term('a', '2024-01-01', null)]);
    expect(getAssignedYears(current, [current], undefined, '2026-10-03')).toEqual([2024, 2025]);
    expect(getAssignedYears(current, [current], undefined, '2025-01-01')).toEqual([2024]);
  });

  it('keeps selected terms separate and unions overlapping terms without double counting', () => {
    const returning = leader('returning', [
      term('first', '2018-01-01', '2020-01-01'),
      term('second', '2022-01-01', '2024-01-01'),
    ]);
    expect(getAssignedYears(returning, [returning])).toEqual([2018, 2019, 2022, 2023]);
    expect(getAssignedYears(returning, [returning], 'second')).toEqual([2022, 2023]);
    expect(getAssignedYears(returning, [returning], 'missing')).toEqual([]);
    const duplicate = leader('dup', [term('a', '2021-01-01', '2021-04-01'), term('b', '2021-02-01', '2021-05-01')]);
    expect(getAssignedYears(duplicate, [duplicate])).toEqual([]);
  });

  it('leaves conflicting majority holders unassigned and ignores invalid dates', () => {
    const first = leader('first', [term('a', '2021-01-01', '2022-01-01')]);
    const second = leader('second', [term('b', '2021-01-01', '2022-01-01')]);
    expect(getAssignedYears(first, [first, second])).toEqual([]);
    const invalid = leader('invalid', [term('bad', '2021-02-29', '2022-01-01')]);
    expect(getAssignedYears(invalid, [invalid])).toEqual([]);
    expect(() => getAssignedYears(first, [first], undefined, '2026-02-30')).toThrow();
  });
});

describe('observations and scores', () => {
  it('uses actual negative and zero values and discloses sparse coverage', () => {
    const subject = leader('a', [term('a', '2018-01-01', '2022-01-01')]);
    const metric = indicator({ values: [{ year: 2018, value: -4 }, { year: 2020, value: 0 }] });
    const result = getLeaderMetrics(subject, [metric], [subject]).metrics[0];
    expect(result).toMatchObject({ average: -2, sampleCount: 2, years: [2018, 2020], coverage: 0.5, change: 4, score: 50 });
    expect(result.values).toEqual(metric.values);
  });

  it('keeps missing values unknown and labels a single observation without inventing a trend', () => {
    const subject = leader('a', [term('a', '2018-01-01', '2022-01-01')]);
    const [missing, single] = getLeaderMetrics(subject, [
      indicator({ values: [] }),
      indicator({ id: 'single', values: [{ year: 2010, value: -1 }, { year: 2020, value: 0 }] }),
    ], [subject]).metrics;
    expect(missing).toMatchObject({ average: null, score: null, sampleCount: 0, coverage: 0, basis: 'none' });
    expect(single).toMatchObject({ average: 0, score: 75, sampleCount: 1, change: null, basis: 'single-year' });
    expect(single.reason).toContain('เพียง 1 ปี');
  });

  it('still requires at least two valid reference years for a percentile', () => {
    const subject = leader('a', [term('a', '2020-01-01', '2021-01-01')]);
    const result = getLeaderMetrics(subject, [indicator({ values: [{ year: 2020, value: 0 }] })], [subject]);
    expect(result.metrics[0]).toMatchObject({ average: 0, score: null, basis: 'single-year' });
    expect(result.metrics[0].reason).toContain('อ้างอิง');
  });

  it('does not score context variables even with complete observations', () => {
    const subject = leader('a', [term('a', '2018-01-01', '2022-01-01')]);
    const results = getLeaderMetrics(subject, [
      indicator({ category: 'fiscal', direction: 'context', scorable: false }),
      indicator({ id: 'disabled', category: 'fiscal', direction: 'lower', scorable: false }),
    ], [subject]);
    expect(results.metrics.every((metric) => metric.average !== null && metric.score === null)).toBe(true);
    expect(results.categories.find((category) => category.id === 'fiscal')?.score).toBeNull();
  });

  it('uses midrank percentiles and reverses only lower-is-better indicators', () => {
    expect(percentileScore(0, [-4, 0, 0, 6], 'higher')).toBe(50);
    expect(percentileScore(6, [-4, 0, 0, 6], 'higher')).toBe(87.5);
    expect(percentileScore(6, [-4, 0, 0, 6], 'lower')).toBe(12.5);
    expect(percentileScore(7, [7, 7, 7], 'higher')).toBe(50);
    expect(percentileScore(7, [7], 'higher')).toBeNull();
  });

  it('omits current/future values from both the mean and percentile reference', () => {
    const subject = leader('a', [term('a', '2024-01-01', null)]);
    const metric = indicator({ values: [
      { year: 2023, value: 0 }, { year: 2024, value: 2 }, { year: 2025, value: 4 },
      { year: 2026, value: -999 }, { year: 2027, value: -999 },
    ] });
    const result = getLeaderMetrics(subject, [metric], [subject]).metrics[0];
    expect(result.years).toEqual([2024, 2025]);
    expect(result.average).toBe(3);
    expect(result.score).toBeCloseTo(100 * 2 / 3);
  });

  it('rejects nonfinite and conflicting duplicate observations without double counting identical duplicates', () => {
    const subject = leader('a', [term('a', '2018-01-01', '2022-01-01')]);
    const metric = indicator({ values: [
      { year: 2018, value: -4 }, { year: 2018, value: -4 },
      { year: 2019, value: 0 }, { year: 2019, value: 1 },
      { year: 2020, value: Number.NaN }, { year: 2021, value: Number.POSITIVE_INFINITY },
    ] });
    expect(getLeaderMetrics(subject, [metric], [subject]).metrics[0])
      .toMatchObject({ average: -4, sampleCount: 1, score: null, years: [2018] });
  });

  it('only provides a benchmark mean for the same exact observed years', () => {
    const subject = leader('a', [term('a', '2018-01-01', '2020-01-01')]);
    const complete = indicator({ benchmark: [{ year: 2017, value: 100 }, { year: 2018, value: 1 }, { year: 2019, value: 3 }] });
    const partial = indicator({ id: 'partial', benchmark: [{ year: 2018, value: 1 }] });
    const [fullResult, partialResult] = getLeaderMetrics(subject, [complete, partial], [subject]).metrics;
    expect(fullResult.benchmarkAverage).toBe(2);
    expect(partialResult.benchmarkAverage).toBeNull();
  });
});

describe('explicit short-tenure country context', () => {
  it('uses only completed calendar years that actually overlap the selected term', () => {
    const short = leader('short', [term('a', '2021-12-31', '2022-01-01')]);
    expect(getAssignedYears(short, [short])).toEqual([]);
    expect(getContextYears(short, [short])).toEqual([2021]);
    const result = getLeaderMetrics(short, [indicator()], [short]);
    expect(result).toMatchObject({ assignedYears: [], contextYears: [2021], usedYears: [2021], basis: 'country-context' });
    expect(result.metrics[0]).toMatchObject({ average: 6, sampleCount: 1, basis: 'country-context', change: null });
    expect(result.categories[0].basis).toBe('country-context');
  });

  it('never substitutes a nearby year or an incomplete current year', () => {
    const current = leader('current', [term('a', '2026-01-01', null)]);
    const result = getLeaderMetrics(current, [indicator({ values: [
      { year: 2025, value: 7 }, { year: 2026, value: 8 }, { year: 2027, value: 9 },
    ] })], [current]);
    expect(result).toMatchObject({ assignedYears: [], contextYears: [], usedYears: [], basis: 'none' });
    expect(result.metrics[0]).toMatchObject({ average: null, score: null, sampleCount: 0 });
    const unavailable = leader('old', [term('old', '1950-02-01', '1950-03-01')]);
    expect(getLeaderMetrics(unavailable, [indicator()], [unavailable]).metrics[0].score).toBeNull();
  });

  it('never mixes minority years into a selection that has majority years', () => {
    const subject = leader('a', [term('a', '2018-12-01', '2020-02-01')]);
    const sparse = indicator({ values: [{ year: 2018, value: 100 }, { year: 2020, value: 200 }] });
    const result = getLeaderMetrics(subject, [sparse], [subject]);
    expect(result).toMatchObject({ assignedYears: [2019], contextYears: [], usedYears: [2019] });
    expect(result.metrics[0]).toMatchObject({ score: null, average: null, basis: 'none' });
  });

  it('respects term selection, exclusive boundaries, overlapping terms, and invalid dates', () => {
    const subject = leader('a', [
      term('first', '2018-12-01', '2019-01-01'),
      term('repeat', '2018-12-15', '2019-01-01'),
      term('second', '2021-06-01', '2021-07-01'),
      term('invalid', '2020-02-30', '2020-03-01'),
    ]);
    expect(getContextYears(subject, [subject])).toEqual([2018, 2021]);
    expect(getContextYears(subject, [subject], 'second')).toEqual([2021]);
    expect(getContextYears(subject, [subject], 'missing')).toEqual([]);
    expect(getLeaderMetrics(subject, [indicator()], [subject], 'second').usedYears).toEqual([2021]);
  });
});

describe('one source per scoring family', () => {
  const subject = leader('a', [term('a', '2018-01-01', '2020-01-01')]);

  it('selects the highest available priority without stitching different series', () => {
    const high = indicator({ id: 'official', scoreFamily: 'growth', scorePriority: 20,
      values: [{ year: 2010, value: 0 }, { year: 2019, value: 10 }] });
    const low = indicator({ id: 'historical', scoreFamily: 'growth', scorePriority: 10 });
    const result = getLeaderMetrics(subject, [low, high], [subject]);
    expect(result.categories[0]).toMatchObject({ scoredMetricCount: 1, scoreMetricIds: ['official'], basis: 'single-year' });
    expect(result.metrics[0].usedInCategory).toBe(false);
    expect(result.metrics[1]).toMatchObject({ usedInCategory: true, years: [2019], average: 10 });
    expect(result.categories[0].score).toBe(result.metrics[1].score);
    expect(result.basis).toBe('single-year');
  });

  it('falls back to an available series and breaks equal priorities deterministically by ID', () => {
    const high = indicator({ id: 'unavailable', scoreFamily: 'growth', scorePriority: 20, values: [] });
    const a = indicator({ id: 'a-source', scoreFamily: 'growth', scorePriority: 10 });
    const z = indicator({ id: 'z-source', scoreFamily: 'growth', scorePriority: 10 });
    for (const candidates of [[high, z, a], [a, z, high]]) {
      const result = getLeaderMetrics(subject, candidates, [subject]);
      expect(result.categories[0].scoreMetricIds).toEqual(['a-source']);
    }
  });

  it('keeps different concepts independent and never promotes context-only variables', () => {
    const result = getLeaderMetrics(subject, [
      indicator({ id: 'primary', scoreFamily: 'growth' }),
      indicator({ id: 'context', scoreFamily: 'growth', scorePriority: 100, scorable: false }),
      indicator({ id: 'other-concept' }),
    ], [subject]);
    expect(new Set(result.categories[0].scoreMetricIds)).toEqual(new Set(['primary', 'other-concept']));
    expect(result.metrics[1].usedInCategory).toBe(false);
  });
});

describe('comparable selections', () => {
  const left = leader('left', [term('l1', '2018-01-01', '2020-01-01')]);
  const right = leader('right', [term('r1', '2020-01-01', '2022-01-01')]);
  const registry = [left, right];

  it('computes category comparisons from the same shared indicators only', () => {
    const common = indicator();
    const leftOnly = indicator({ id: 'left-only', values: [{ year: 2018, value: 100 }, { year: 2019, value: 100 }] });
    const rightOnly = indicator({ id: 'right-only', values: [{ year: 2020, value: -100 }, { year: 2021, value: -100 }] });
    const result = getComparison(left, right, [common, leftOnly, rightOnly], registry);
    const shared = result.categories.find((category) => category.id === 'economy');
    expect(shared).toMatchObject({ sharedMetricCount: 1, metricIds: ['growth'] });
    expect(shared?.leftScore).toBe(result.metrics[0].left.score);
    expect(shared?.rightScore).toBe(result.metrics[0].right.score);
    expect(result.left.categories[0].scoredMetricCount).toBe(2);
    expect(shared?.leftScore).not.toBe(result.left.categories[0].score);
  });

  it('leaves category comparisons unknown when no indicator is shared', () => {
    const result = getComparison(left, right, [indicator({ values: [{ year: 2018, value: 1 }, { year: 2019, value: 2 }] })], registry);
    expect(result.categories[0]).toMatchObject({ leftScore: null, rightScore: null, sharedMetricCount: 0 });
    expect(result.metrics[0]).toMatchObject({ comparable: false, difference: null, favorable: null });
  });

  it('shows raw direction without an overall verdict, and leaves context undecided', () => {
    const result = getComparison(left, right, [
      indicator(), indicator({ id: 'lower', direction: 'lower' }),
      indicator({ id: 'context', direction: 'context', scorable: false }),
    ], registry);
    expect(result.metrics.map((metric) => metric.favorable)).toEqual(['right', 'left', null]);
    expect(result.metrics.map((metric) => metric.difference)).toEqual([-6, -6, -6]);
    expect(result).not.toHaveProperty('winner');
  });

  it('respects different selected terms in a comparison', () => {
    const returning = leader('returning', [term('early', '2014-01-01', '2016-01-01'), term('late', '2018-01-01', '2020-01-01')]);
    const result = getComparison(returning, right, [indicator()], [returning, right], 'early', 'r1');
    expect(result.left.assignedYears).toEqual([2014, 2015]);
    expect(result.left.termLabel).toBe('early');
    expect(result.metrics[0].left.average).toBeNull();
    expect(result.metrics[0].comparable).toBe(false);
  });

  it('selects one common series per family independently of each profile preferred source', () => {
    const history = indicator({ id: 'historical', scoreFamily: 'growth', scorePriority: 10 });
    const modern = indicator({ id: 'modern', scoreFamily: 'growth', scorePriority: 20,
      values: [{ year: 2020, value: 100 }, { year: 2021, value: 200 }] });
    const result = getComparison(left, right, [modern, history], registry);
    expect(result.left.categories[0].scoreMetricIds).toEqual(['historical']);
    expect(result.right.categories[0].scoreMetricIds).toEqual(['modern']);
    expect(result.categories[0]).toMatchObject({ metricIds: ['historical'], sharedMetricCount: 1,
      leftBasis: 'tenure', rightBasis: 'tenure' });
    expect(result.categories[0].rightScore).toBe(result.metrics[1].right.score);
    expect(result.categories[0].rightScore).not.toBe(result.right.categories[0].score);
  });

  it('does not compare distinct series merely because they have the same family', () => {
    const result = getComparison(left, right, [
      indicator({ id: 'left-only', scoreFamily: 'growth', unit: 'USD', values: [{ year: 2018, value: 1 }, { year: 2019, value: 2 }] }),
      indicator({ id: 'right-only', scoreFamily: 'growth', unit: 'THB', values: [{ year: 2020, value: 3 }, { year: 2021, value: 4 }] }),
    ], registry);
    expect(result.categories[0]).toMatchObject({ sharedMetricCount: 0, leftScore: null, rightScore: null });
  });

  it('allows observed single-year and country-context comparisons without favorable flags', () => {
    const single = leader('single', [term('single', '2018-01-01', '2019-01-01')]);
    const short = leader('short', [term('short', '2020-03-01', '2020-04-01')]);
    const singleResult = getComparison(single, right, [indicator()], [single, right]);
    expect(singleResult.metrics[0]).toMatchObject({ comparable: true, difference: -8, favorable: null });
    expect(singleResult.categories[0]).toMatchObject({ leftBasis: 'single-year', rightBasis: 'tenure' });
    const shortResult = getComparison(single, short, [indicator()], [single, short]);
    expect(shortResult.metrics[0]).toMatchObject({ comparable: true, difference: -6, favorable: null });
    expect(shortResult.categories[0]).toMatchObject({ leftBasis: 'single-year', rightBasis: 'country-context' });
  });
});

describe('display without invented data', () => {
  it('preserves gaps in years, keeps zero, and formats unknowns distinctly', () => {
    expect(formatYears([2023, 2018, 2019, 2023, 2021])).toBe('2018–2019, 2021, 2023');
    expect(formatValue(0)).toBe('0');
    expect(formatValue(null)).toBe('ไม่มีข้อมูล');
    expect(formatValue(-1.234, indicator(), true)).toBe('-1.23 % ต่อปี');
    expect(formatScore(null)).toBe('—');
    expect(formatScore(0)).toBe('0');
    expect(getMetricBasisLabel('tenure')).toBe('หลายปีในวาระ');
    expect(getMetricBasisLabel('single-year')).toBe('ข้อมูลปีเดียว');
    expect(getMetricBasisLabel('country-context')).toBe('บริบทประเทศ');
    expect(getMetricBasisLabel('none')).toBe('ไม่มีข้อมูล');
  });
});

describe('published snapshot integrity', () => {
  const roster = leaderSnapshot as LeadersDataset;
  const data = indicatorSnapshot as IndicatorsDataset;

  it('preserves one shared snapshot date and unique source-backed observations', () => {
    expect(roster.asOf).toBe(data.asOf);
    const currentYear = Number(data.asOf.slice(0, 4));
    expect(new Set(roster.leaders.map((item) => item.id)).size).toBe(roster.leaders.length);
    expect(new Set(data.indicators.map((item) => item.id)).size).toBe(data.indicators.length);
    for (const metric of data.indicators) {
      expect(metric.source.url).toMatch(/^https:\/\//);
      expect(metric.source.code.length).toBeGreaterThan(0);
      if (metric.source.lastUpdated) expect(metric.source.lastUpdated <= data.asOf).toBe(true);
      for (const series of [metric.values, metric.benchmark ?? []]) {
        expect(new Set(series.map((point) => point.year)).size).toBe(series.length);
        expect(series.every((point) => Number.isFinite(point.value) && Number.isInteger(point.year) && point.year < currentYear)).toBe(true);
      }
      for (const range of metric.uncertainty ?? []) {
        const value = metric.values.find((point) => point.year === range.year)?.value;
        expect(value).toBeDefined();
        expect(range.lower).toBeLessThanOrEqual(value!);
        expect(range.upper).toBeGreaterThanOrEqual(value!);
      }
    }
  });

  it('assigns each historical year at most once and only scores real sufficient data', () => {
    const assignments = new Map<number, string>();
    for (const subject of roster.leaders) {
      const result = getLeaderMetrics(subject, data.indicators, roster.leaders, undefined, data.asOf);
      for (const year of result.assignedYears) {
        expect(assignments.has(year), `${year} was already assigned to ${assignments.get(year)}`).toBe(false);
        assignments.set(year, subject.id);
      }
      for (const metric of result.metrics) {
        if (metric.score !== null) {
          expect(metric.sampleCount).toBeGreaterThanOrEqual(1);
          expect(metric.indicator.scorable).toBe(true);
          expect(metric.indicator.direction).not.toBe('context');
          expect(metric.score).toBeGreaterThanOrEqual(0);
          expect(metric.score).toBeLessThanOrEqual(100);
          expect(metric.years.every((year) => result.usedYears.includes(year))).toBe(true);
          expect(metric.basis).not.toBe('none');
        }
      }
    }
    const first = roster.leaders.find((item) => item.ordinal === 1)!;
    expect(first).toBeDefined();
    const firstMetrics = getLeaderMetrics(first, data.indicators, roster.leaders);
    for (const metric of firstMetrics.metrics) {
      expect(metric.values.every((point) => firstMetrics.usedYears.includes(point.year))).toBe(true);
    }
  });

  it('provides sourced observations for every published leader without double-counting source families', () => {
    for (const subject of roster.leaders) {
      const result = getLeaderMetrics(subject, data.indicators, roster.leaders, undefined, data.asOf);
      expect(result.scoredCategoryCount, `${subject.name} has no sourced index`).toBeGreaterThan(0);
      for (const category of result.categories) {
        const chosen = category.metrics.filter((metric) => metric.usedInCategory);
        const families = chosen.map((metric) => metric.indicator.scoreFamily || metric.indicator.id);
        expect(new Set(families).size).toBe(families.length);
        expect(new Set(category.scoreMetricIds)).toEqual(new Set(chosen.map((metric) => metric.indicator.id)));
      }
    }
  });
});
