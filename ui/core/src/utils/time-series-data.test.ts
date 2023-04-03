// Copyright 2023 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { TimeScale, TimeSeries, TimeSeriesData } from '../model';
import { getXValues, getYValues, getCommonTimeScale } from './time-series-data';

function getExpectedIntervals(timeScale: TimeScale): number {
  return Math.floor((timeScale.endMs - timeScale.startMs) / timeScale.stepMs) + 1;
}

type GenerateMockTimeSeriesOpts = {
  /**
   * Name of the series
   */
  name: string;

  /**
   * Number of entries to generate.
   */
  count: number;

  /**
   * Timestamp to starget generating values.
   */
  startMs: number;

  /**
   * Step to use when generating additional values.
   */
  stepMs: number;
};

function generateMockTimeSeries({ name, count, startMs, stepMs }: GenerateMockTimeSeriesOpts): TimeSeries {
  return {
    name: name,
    values: [...Array(count)].map((_, i) => {
      return [startMs + stepMs * i, i];
    }),
  };
}

describe('getXValues', () => {
  test('returns timestamp values for the x axis', () => {
    const timeScale: TimeScale = {
      startMs: 1646164800000,
      endMs: 1646251200000,
      stepMs: 3600000,
    };
    const xValues = getXValues(timeScale);

    // Start and end of time scale are retained.
    expect(xValues[0]).toEqual(timeScale.startMs);
    expect(xValues.at(-1)).toEqual(timeScale.endMs);

    // The expected number of intervals are included in the results
    expect(xValues).toHaveLength(getExpectedIntervals(timeScale));

    expect(xValues).toMatchSnapshot();
  });
});

describe('getYValues', () => {
  test('uses the specified values if they have no missing timestamps', () => {
    const timeScale: TimeScale = {
      startMs: 1646164800000,
      endMs: 1646251200000,
      stepMs: 3600000,
    };

    const series = generateMockTimeSeries({
      name: 'my series',
      count: getExpectedIntervals(timeScale),
      startMs: timeScale.startMs,
      stepMs: timeScale.stepMs,
    });

    const yValues = getYValues(series, timeScale);
    yValues.forEach((entry) => {
      expect(entry).not.toBeNull();
    });
    expect(yValues).toMatchSnapshot();
  });

  test('fills in null values when there are no values', () => {
    const series: TimeSeries = {
      name: 'my series',
      values: [],
    };
    const timeScale: TimeScale = {
      startMs: 1646164800000,
      endMs: 1646251200000,
      stepMs: 3600000,
    };
    const yValues = getYValues(series, timeScale);
    expect(yValues).toMatchSnapshot();
  });

  test('fills in null values when missing some values at the end', () => {
    const timeScale: TimeScale = {
      startMs: 1646164800000,
      endMs: 1646251200000,
      stepMs: 3600000,
    };
    const expectedIntervals = getExpectedIntervals(timeScale);
    const expectedNulls = Math.ceil(expectedIntervals / 2);

    const series = generateMockTimeSeries({
      name: 'my series',
      count: expectedIntervals - expectedNulls + 1,
      startMs: timeScale.startMs,
      stepMs: timeScale.stepMs,
    });

    const yValues = getYValues(series, timeScale);
    expect(yValues).toMatchSnapshot();
  });

  test('fills in null values when missing some values at the beginning', () => {
    const timeScale: TimeScale = {
      startMs: 1646164800000,
      endMs: 1646251200000,
      stepMs: 3600000,
    };
    const expectedIntervals = getExpectedIntervals(timeScale);
    const expectedNulls = Math.ceil(expectedIntervals / 2);

    const series = generateMockTimeSeries({
      name: 'my series',
      count: expectedIntervals - expectedNulls + 1,
      startMs: timeScale.startMs + Math.floor((timeScale.endMs - timeScale.startMs) / 2),
      stepMs: timeScale.stepMs,
    });

    const yValues = getYValues(series, timeScale);
    expect(yValues).toMatchSnapshot();
  });

  test('fills in null values when missing some values in the middle', () => {
    const timeScale: TimeScale = {
      startMs: 1646164800000,
      endMs: 1646251200000,
      stepMs: 3600000,
    };
    const expectedIntervals = getExpectedIntervals(timeScale);
    const expectedNulls = Math.ceil(expectedIntervals / 2);

    const series = generateMockTimeSeries({
      name: 'my series',
      count: expectedIntervals - expectedNulls + 1,
      startMs: timeScale.startMs + Math.floor((timeScale.endMs - timeScale.startMs) / 4),
      stepMs: timeScale.stepMs,
    });

    const yValues = getYValues(series, timeScale);
    expect(yValues).toMatchSnapshot();
  });
});

describe('getCommonTimeScale', () => {
  const undefinedSeriesData: Array<{
    name: string;
    seriesData: Array<TimeSeriesData | undefined>;
  }> = [
    {
      name: 'when series data is empty',
      seriesData: [],
    },
    {
      name: 'when series is missing step',
      seriesData: [
        {
          timeRange: {
            start: new Date('Tue Mar 28 2023 16:47:00 GMT-0700 (Pacific Daylight Time)'),
            end: new Date('Tue Mar 28 2023 04:47:00 GMT-0700 (Pacific Daylight Time)'),
          },
          series: [],
        },
      ],
    },
    {
      name: 'when series is missing time range',
      seriesData: [
        {
          stepMs: 6000,
          series: [],
        },
      ],
    },
  ];

  test.each(undefinedSeriesData)('returns undefined $name', ({ seriesData }) => {
    expect(getCommonTimeScale(seriesData)).toBeUndefined;
  });

  test('uses the specified time scale when a single series is available', () => {
    const singleTimeSeries: TimeSeriesData = {
      timeRange: {
        start: new Date('Tue Mar 28 2023 16:47:00 GMT-0700 (Pacific Daylight Time)'),
        end: new Date('Tue Mar 28 2023 04:47:00 GMT-0700 (Pacific Daylight Time)'),
      },
      stepMs: 3600,
      series: [],
    };
    const seriesData: Array<TimeSeriesData | undefined> = [singleTimeSeries];
    const timeScale = getCommonTimeScale(seriesData);

    expect(timeScale).toEqual({
      startMs: singleTimeSeries.timeRange?.start.getTime(),
      endMs: singleTimeSeries.timeRange?.end.getTime(),
      stepMs: singleTimeSeries.stepMs,
    });
  });

  test('uses the min/max dates when multiple ranges available', () => {
    const minTime = new Date('Tue Mar 21 2023 17:00:00 GMT-0700 (Pacific Daylight Time)');
    const maxTime = new Date('Tue Mar 28 2023 17:00:00 GMT-0700 (Pacific Daylight Time)');

    const seriesData: Array<TimeSeriesData | undefined> = [
      {
        timeRange: {
          start: minTime,
          end: new Date('Tue Mar 28 2023 04:47:00 GMT-0700 (Pacific Daylight Time)'),
        },
        stepMs: 3600,
        series: [],
      },
      {
        timeRange: {
          start: new Date('Tue Mar 28 2023 16:47:00 GMT-0700 (Pacific Daylight Time)'),
          end: new Date('Tue Mar 28 2023 17:00:00 GMT-0700 (Pacific Daylight Time)'),
        },
        stepMs: 3600,
        series: [],
      },
      {
        timeRange: {
          start: new Date('Tue Mar 28 2023 16:47:00 GMT-0700 (Pacific Daylight Time)'),
          end: maxTime,
        },
        stepMs: 3600,
        series: [],
      },
    ];
    const timeScale = getCommonTimeScale(seriesData);
    expect(timeScale).toEqual({
      startMs: minTime.getTime(),
      endMs: maxTime.getTime(),
      stepMs: 3600,
    });
  });

  test('uses the greatest common denominator when multiple steps are available', () => {
    const timeRange = {
      start: new Date('Tue Mar 28 2023 16:47:00 GMT-0700 (Pacific Daylight Time)'),
      end: new Date('Tue Mar 28 2023 17:00:00 GMT-0700 (Pacific Daylight Time)'),
    };
    const steps = [2400, 3600, 18000];

    const seriesData: Array<TimeSeriesData | undefined> = [
      {
        timeRange: timeRange,
        stepMs: steps[0],
        series: [],
      },
      {
        timeRange: timeRange,
        stepMs: steps[1],
        series: [],
      },
      {
        timeRange: timeRange,
        stepMs: steps[2],
        series: [],
      },
    ];
    const timeScale = getCommonTimeScale(seriesData);
    expect(timeScale).toEqual({
      startMs: timeRange.start.getTime(),
      endMs: timeRange.end.getTime(),
      stepMs: 1200,
    });
  });
});
