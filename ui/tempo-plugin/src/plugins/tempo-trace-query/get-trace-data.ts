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

import { TraceQueryPlugin } from '@perses-dev/plugin-system';
import { TraceData, TraceValue, AbsoluteTimeRange } from '@perses-dev/core';
import { getUnixTime } from 'date-fns';
import { TempoTraceQuerySpec } from '../../model/trace-query-model';
import { TEMPO_DATASOURCE_KIND, TempoDatasourceSelector } from '../../model/tempo-selectors';
import { TempoClient } from '../../model/tempo-client';

export function getUnixTimeRange(timeRange: AbsoluteTimeRange) {
  const { start, end } = timeRange;
  return {
    start: Math.ceil(getUnixTime(start)),
    end: Math.ceil(getUnixTime(end)),
  };
}

export const getTraceData: TraceQueryPlugin<TempoTraceQuerySpec>['getTraceData'] = async (spec, context) => {
  if (spec.query === undefined || spec.query === null || spec.query === '') {
    // Do not make a request to the backend, instead return an empty TraceData
    console.error('TempoTraceQuery is undefined, null, or an empty string.');
    return { traces: [] };
  }

  const defaultTempoDatasource: TempoDatasourceSelector = {
    kind: TEMPO_DATASOURCE_KIND,
  };

  const client: TempoClient = await context.datasourceStore.getDatasourceClient(
    spec.datasource ?? defaultTempoDatasource
  );

  const datasourceUrl = client?.options?.datasourceUrl;
  if (datasourceUrl === undefined || datasourceUrl === null || datasourceUrl === '') {
    console.error('TempoDatasource is undefined, null, or an empty string.');
    return { traces: [] };
  }

  const getQuery = () => {
    // if time range not defined -- only return the query from the spec
    if (context.absoluteTimeRange === undefined) {
      return spec.query;
    }
    // if the query already contains a time range (i.e.start and end times)
    if (spec.query.includes('start=') || spec.query.includes('end=')) {
      return spec.query;
    }
    // handle time range selection from UI drop down (e.g. last 5 minutes, last 1 hour )
    const { start, end } = getUnixTimeRange(context?.absoluteTimeRange);
    const queryStartTime = '&start=' + start;
    const queryEndTime = '&end=' + end;
    const queryWithTimeRange = encodeURI(spec.query) + queryStartTime + queryEndTime;
    return queryWithTimeRange;
  };

  const enrichedTraceResponse = await client.getEnrichedTraceQuery(getQuery(), datasourceUrl);

  const traces: TraceValue[] = enrichedTraceResponse.traces.map((traceValue) => {
    const startTimeUnixMs = parseInt(traceValue.summary.startTimeUnixNano) * 1e-6; // convert to millisecond for eChart time format
    const durationMs = traceValue.summary.durationMs;
    const spanCount = traceValue.spanCount;
    const errorCount = traceValue.errorCount;
    const traceId = traceValue.summary.traceID;
    const name = `rootServiceName="${traceValue.summary.rootServiceName.trim()}", rootTraceName="${traceValue.summary.rootServiceName.trim()}"`;

    return {
      startTimeUnixMs,
      durationMs,
      spanCount,
      errorCount,
      traceId,
      name,
    };
  });

  const traceData: TraceData = {
    traces,
    metadata: {
      executedQueryString: spec.query,
    },
  };

  return traceData;
};
