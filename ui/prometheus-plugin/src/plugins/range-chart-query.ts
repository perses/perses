import {
  JsonObject,
  UseChartQueryHook,
  ChartQueryDefinition,
  DurationString,
  useDashboardSpec,
} from '@perses-ui/core';
import { useMemo } from 'react';
import { RangeQueryRequestParameters } from '../model/api-types';
import { createDataFrames } from '../model/data-frames';
import { useRangeQuery } from '../model/prometheus-client';
import { TemplateString, useReplaceTemplateString } from '../model/templating';
import {
  getDurationStringSeconds,
  useDashboardPrometheusTimeRange,
  usePanelRangeStep,
} from '../model/time';

export const PrometheusRangeChartQueryKind = 'PrometheusRangeChartQuery';

type PrometheusRangeChartQuery = ChartQueryDefinition<
  RangeChartQueryKind,
  RangeChartQueryOptions
>;

type RangeChartQueryKind = typeof PrometheusRangeChartQueryKind;

interface RangeChartQueryOptions extends JsonObject {
  query: TemplateString;
  min_step?: DurationString;
  resolution?: number;
}

export function usePrometheusRangeChartQuery(
  definition: PrometheusRangeChartQuery
): ReturnType<UseChartQueryHook<RangeChartQueryKind, RangeChartQueryOptions>> {
  const spec = useDashboardSpec();
  const dataSource = definition.datasource ?? spec.datasource;

  const minStep = getDurationStringSeconds(definition.options.min_step);
  const timeRange = useDashboardPrometheusTimeRange();
  const step = usePanelRangeStep(timeRange, minStep);

  const { result: query, needsVariableValuesFor } = useReplaceTemplateString(
    definition.options.query
  );

  const request: RangeQueryRequestParameters = {
    query,
    ...timeRange,
    step,
  };

  const { response, loading, error } = useRangeQuery(dataSource, request, {
    pause: needsVariableValuesFor.size > 0,
  });

  const data = useMemo(() => createDataFrames(response), [response]);
  return { data, loading, error };
}
