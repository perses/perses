// Copyright The Perses Authors
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

import { TimeSeriesData, TimeSeries } from '@perses-dev/core';
import { TimeSeriesQueryPlugin, replaceVariables } from '@perses-dev/plugin-system';
import { OpenGeminiTimeSeriesQuerySpec } from './opengemini-time-series-query-types';
import { OpenGeminiQueryResponse, OpenGeminiSeries, OpenGeminiClient } from '../../datasources/opengemini-datasource';
import { DEFAULT_OPENGEMINI_DATASOURCE } from './constants';

/**
 * Transforms an OpenGemini series to a Perses TimeSeries.
 * OpenGemini returns data in InfluxDB format with columns and values arrays.
 */
function transformSeries(series: OpenGeminiSeries): TimeSeries[] {
    const timeIndex = series.columns.indexOf('time');
    if (timeIndex === -1) {
        console.warn('No time column found in OpenGemini response');
        return [];
    }

    // Find value columns (all columns except 'time')
    const valueColumns = series.columns
        .map((col, idx) => ({ col, idx }))
        .filter(({ col }) => col !== 'time');

    // Generate a TimeSeries for each value column
    return valueColumns.map(({ col, idx }) => {
        // Build series name including tags if present
        let name = series.name;
        if (series.tags) {
            const tagStr = Object.entries(series.tags)
                .map(([k, v]) => `${k}=${v}`)
                .join(', ');
            name = `${name}{${tagStr}}`;
        }
        if (valueColumns.length > 1) {
            name = `${name}.${col}`;
        }

        // Transform values to [timestamp, value] tuples
        const values: Array<[number, number | null]> = series.values.map((row) => {
            const timestamp = row[timeIndex] as number;
            const value = row[idx] as number | null;
            return [timestamp, value];
        });

        return {
            name,
            values,
        };
    });
}

/**
 * Builds time series data from an OpenGemini query response.
 */
function buildTimeSeries(response: OpenGeminiQueryResponse): TimeSeries[] {
    const allSeries: TimeSeries[] = [];

    for (const result of response.results) {
        if (result.error) {
            console.error('OpenGemini query error:', result.error);
            continue;
        }

        if (result.series) {
            for (const series of result.series) {
                allSeries.push(...transformSeries(series));
            }
        }
    }

    return allSeries;
}

/**
 * Fetches time series data from OpenGemini.
 */
export const getTimeSeriesData: TimeSeriesQueryPlugin<OpenGeminiTimeSeriesQuerySpec>['getTimeSeriesData'] = async (
    spec,
    context
) => {
    // Return empty data if the query is empty
    if (!spec.query || !spec.database) {
        return { series: [] };
    }

    // Replace variables in the query
    const query = replaceVariables(spec.query, context.variableState);
    const database = replaceVariables(spec.database, context.variableState);

    // Get the OpenGemini client
    const client = (await context.datasourceStore.getDatasourceClient(
        spec.datasource ?? DEFAULT_OPENGEMINI_DATASOURCE
    )) as OpenGeminiClient;

    // Execute the query with epoch=ms for millisecond timestamps
    const response = await client.query({
        db: database,
        q: query,
        epoch: 'ms',
    });

    // Transform the response to Perses format
    const { start, end } = context.timeRange;
    const chartData: TimeSeriesData = {
        series: buildTimeSeries(response),
        timeRange: { start, end },
        metadata: {
            executedQueryString: query,
        },
    };

    return chartData;
};
