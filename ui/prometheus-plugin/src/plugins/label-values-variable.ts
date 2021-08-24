import {
  JsonObject,
  VariableDefinition,
  UseVariableOptionsHook,
  useDashboardSpec,
  useMemoized,
} from '@perses-ui/core';
import { LabelValuesRequestParameters } from '../model/api-types';
import { useDashboardPrometheusTimeRange } from '../model/time';
import { TemplateString, useReplaceTemplateStrings } from '../model/templating';
import { useLabelValues } from '../model/prometheus-client';

export const PrometheusLabelValuesKind = 'PrometheusLabelValues' as const;

type PrometheusLabelValues = VariableDefinition<
  LabelValuesKind,
  LabelValuesOptions
>;

type LabelValuesKind = typeof PrometheusLabelValuesKind;

interface LabelValuesOptions extends JsonObject {
  label_name: string;
  match?: TemplateString[];
}

/**
 * Get variable option values by running a Prometheus label values query.
 */
export function usePrometheusLabelValues(
  definition: PrometheusLabelValues
): ReturnType<UseVariableOptionsHook<LabelValuesKind, LabelValuesOptions>> {
  const spec = useDashboardSpec();
  const dataSource = definition.datasource ?? spec.datasource;

  const { start, end } = useDashboardPrometheusTimeRange();
  const { result: match, needsVariableValuesFor } = useReplaceTemplateStrings(
    definition.options.match
  );

  // Make the request, pausing any requests that are still waiting on variable
  // values to be filled in/selected
  const request: LabelValuesRequestParameters = {
    labelName: definition.options.label_name,
    match,
    start,
    end,
  };
  const { response, loading, error } = useLabelValues(dataSource, request, {
    pause: needsVariableValuesFor.size > 0,
  });

  const data = useMemoized(() => response?.data ?? [], [response]);
  return {
    data: data,
    loading: loading || needsVariableValuesFor.size > 0,
    error: error,
  };
}
