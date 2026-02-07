// LOGZ.IO FILE:: APPZ-955-math-on-queries-formulas

import { TimeSeriesData } from '@perses-dev/core';
import {
  areDependenciesResolved,
  areMapsEqual,
  detectCircularDependency,
  formatCyclePath,
} from './time-series-queries-utils';

describe('areDependenciesResolved', () => {
  test('returns true when query has no dependencies', () => {
    const dependencies = new Map<number, number[]>();
    dependencies.set(0, []);
    const resolvedResults = new Map<number, TimeSeriesData>();

    expect(areDependenciesResolved(0, dependencies, resolvedResults)).toBe(true);
  });

  test('returns true when self-dependency only', () => {
    const dependencies = new Map<number, number[]>();
    dependencies.set(0, [0]);
    const resolvedResults = new Map<number, TimeSeriesData>();

    expect(areDependenciesResolved(0, dependencies, resolvedResults)).toBe(true);
  });

  test('returns false when external dependency not resolved', () => {
    const dependencies = new Map<number, number[]>();
    dependencies.set(0, [1]);
    dependencies.set(1, []);
    const resolvedResults = new Map<number, TimeSeriesData>();

    expect(areDependenciesResolved(0, dependencies, resolvedResults)).toBe(false);
  });

  test('returns true when all external dependencies resolved', () => {
    const dependencies = new Map<number, number[]>();
    dependencies.set(0, [1, 2]);
    dependencies.set(1, []);
    dependencies.set(2, []);
    const resolvedResults = new Map<number, TimeSeriesData>();
    resolvedResults.set(1, { series: [], metadata: {} });
    resolvedResults.set(2, { series: [], metadata: {} });

    expect(areDependenciesResolved(0, dependencies, resolvedResults)).toBe(true);
  });
});

describe('detectCircularDependency', () => {
  test('returns no cycle for query with no dependencies', () => {
    const dependencies = new Map<number, number[]>();
    dependencies.set(0, []);

    const result = detectCircularDependency(0, dependencies);

    expect(result.hasCycle).toBe(false);
    expect(result.cyclePath).toEqual([]);
  });

  test('returns no cycle for linear dependency chain', () => {
    const dependencies = new Map<number, number[]>();
    dependencies.set(0, [1]);
    dependencies.set(1, [2]);
    dependencies.set(2, []);

    const result = detectCircularDependency(0, dependencies);

    expect(result.hasCycle).toBe(false);
  });

  test('detects simple circular dependency between two queries', () => {
    const dependencies = new Map<number, number[]>();
    dependencies.set(0, [1]);
    dependencies.set(1, [0]);

    const result = detectCircularDependency(0, dependencies);

    expect(result.hasCycle).toBe(true);
    expect(result.cyclePath).toContain(0);
    expect(result.cyclePath).toContain(1);
  });

  test('detects circular dependency in chain of three queries', () => {
    const dependencies = new Map<number, number[]>();
    dependencies.set(0, [1]);
    dependencies.set(1, [2]);
    dependencies.set(2, [0]);

    const result = detectCircularDependency(0, dependencies);

    expect(result.hasCycle).toBe(true);
    expect(result.cyclePath.length).toBeGreaterThanOrEqual(2);
  });

  test('ignores self-dependencies when detecting cycles', () => {
    const dependencies = new Map<number, number[]>();
    dependencies.set(0, [0]);

    const result = detectCircularDependency(0, dependencies);

    expect(result.hasCycle).toBe(false);
  });

  test('detects cycle with self-dependency and external cycle', () => {
    const dependencies = new Map<number, number[]>();
    dependencies.set(0, [0, 1]);
    dependencies.set(1, [0]);

    const result = detectCircularDependency(0, dependencies);

    expect(result.hasCycle).toBe(true);
  });

  test('handles complex dependency graph with multiple branches', () => {
    const dependencies = new Map<number, number[]>();
    dependencies.set(0, [1, 2]);
    dependencies.set(1, [3]);
    dependencies.set(2, [3]);
    dependencies.set(3, []);

    const result = detectCircularDependency(0, dependencies);

    expect(result.hasCycle).toBe(false);
  });

  test('handles complex dependency graph with cycle in one branch', () => {
    const dependencies = new Map<number, number[]>();
    dependencies.set(0, [1, 2]);
    dependencies.set(1, [3]);
    dependencies.set(2, [3]);
    dependencies.set(3, [1]);

    const result = detectCircularDependency(0, dependencies);

    expect(result.hasCycle).toBe(true);
  });
});

describe('formatCyclePath', () => {
  test('formats single query index', () => {
    expect(formatCyclePath([0])).toBe('Query #1');
  });

  test('formats multiple query indices with arrow separator', () => {
    expect(formatCyclePath([0, 1])).toBe('Query #1 -> Query #2');
  });

  test('formats cycle path with three queries', () => {
    expect(formatCyclePath([0, 1, 2])).toBe('Query #1 -> Query #2 -> Query #3');
  });
});

describe('areMapsEqual', () => {
  const createMockData = (): TimeSeriesData => ({ series: [], metadata: {} });

  test('returns true for two empty maps', () => {
    const map1 = new Map<number, TimeSeriesData>();
    const map2 = new Map<number, TimeSeriesData>();

    expect(areMapsEqual(map1, map2)).toBe(true);
  });

  test('returns false when maps have different sizes', () => {
    const map1 = new Map<number, TimeSeriesData>();
    const map2 = new Map<number, TimeSeriesData>();
    map1.set(0, createMockData());

    expect(areMapsEqual(map1, map2)).toBe(false);
  });

  test('returns true when maps have same keys with same references', () => {
    const data1 = createMockData();
    const data2 = createMockData();
    const map1 = new Map<number, TimeSeriesData>();
    const map2 = new Map<number, TimeSeriesData>();
    map1.set(0, data1);
    map1.set(1, data2);
    map2.set(0, data1);
    map2.set(1, data2);

    expect(areMapsEqual(map1, map2)).toBe(true);
  });

  test('returns false when maps have same keys but different references', () => {
    const map1 = new Map<number, TimeSeriesData>();
    const map2 = new Map<number, TimeSeriesData>();
    map1.set(0, createMockData());
    map2.set(0, createMockData());

    expect(areMapsEqual(map1, map2)).toBe(false);
  });

  test('returns false when maps have different keys', () => {
    const data = createMockData();
    const map1 = new Map<number, TimeSeriesData>();
    const map2 = new Map<number, TimeSeriesData>();
    map1.set(0, data);
    map2.set(1, data);

    expect(areMapsEqual(map1, map2)).toBe(false);
  });
});
