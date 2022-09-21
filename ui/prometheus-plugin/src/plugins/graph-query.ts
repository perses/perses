// Copyright 2022 The Perses Authors
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

import { DurationString, useMemoized, GraphQueryDefinition } from '@perses-dev/core';
import { GraphData, GraphQueryPlugin, UseGraphQueryHook, UseGraphQueryHookOptions } from '@perses-dev/plugin-system';
import { fromUnixTime } from 'date-fns';
import { useMemo } from 'react';
import { RangeQueryRequestParameters } from '../model/api-types';
import { parseValueTuple } from '../model/parse-sample-values';
import { useRangeQuery } from '../model/prometheus-client';
import { TemplateString, useReplaceTemplateString } from '../model/templating';
import { getDurationStringSeconds, useDashboardPrometheusTimeRange, usePanelRangeStep } from '../model/time';

interface PrometheusGraphQueryOptions {
  query: TemplateString;
  min_step?: DurationString;
  resolution?: number;
}

function usePrometheusGraphQuery(
  definition: GraphQueryDefinition<PrometheusGraphQueryOptions>,
  hookOptions?: UseGraphQueryHookOptions
): ReturnType<UseGraphQueryHook<PrometheusGraphQueryOptions>> {
  const pluginSpec = definition.spec.plugin.spec;

  const minStep = getDurationStringSeconds(pluginSpec.min_step);
  const timeRange = useDashboardPrometheusTimeRange();
  const step = usePanelRangeStep(timeRange, minStep, undefined, hookOptions?.suggestedStepMs);

  // Align the time range so that it's a multiple of the step (TODO: we may
  // ultimately want to return this from the hook so that charts will know what
  // time range was actually used?)
  const { start, end } = useMemoized(() => {
    const { start, end } = timeRange;
    const utcOffsetSec = new Date().getTimezoneOffset() * 60;

    const alignedEnd = Math.floor((end + utcOffsetSec) / step) * step - utcOffsetSec;
    const alignedStart = Math.floor((start + utcOffsetSec) / step) * step - utcOffsetSec;

    return {
      start: alignedStart,
      end: alignedEnd,
    };
  }, [timeRange, step]);

  const query = useReplaceTemplateString(pluginSpec.query.replace('$__rate_interval', `15s`));

  const request: RangeQueryRequestParameters = {
    query,
    start,
    end,
    step,
  };

  const {
    data: response,
    isLoading: loading,
    error,
  } = useRangeQuery(request, {
    enabled: true,
  });

  const data = useMemo(() => {
    if (response === undefined) return undefined;
    if (response.status === 'error') return undefined;

    // TODO: Maybe do a proper Iterable implementation that defers some of this
    // processing until its needed
    const chartData: GraphData = {
      timeRange: { start: fromUnixTime(start), end: fromUnixTime(end) },
      stepMs: step * 1000,
      series: response.data.result.map((value) => {
        const { metric, values } = value;

        // Name the series after the metric labels or if no metric, just use the
        // overall query
        let name = Object.entries(metric)
          .map(([labelName, labelValue]) => `${labelName}="${labelValue}"`)
          .join(', ');
        if (name === '') name = query;

        return {
          name,
          values: values.map(parseValueTuple),
        };
      }),
    };

    return chartData;
  }, [response, start, end, step, query]);

  return { data, loading, error: error ?? undefined };
}

/**
 * The core Prometheus GraphQuery plugin for Perses.
 */
export const PrometheusGraphQuery: GraphQueryPlugin<PrometheusGraphQueryOptions> = {
  useGraphQuery: usePrometheusGraphQuery,
};
