// Copyright 2021 The Perses Authors
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

import { JsonObject, VariableDefinition } from '@perses-dev/core';
import { UseVariableOptionsHook } from '@perses-dev/plugin-system';
import { TemplateString, useReplaceTemplateStrings } from '../model/templating';
import { useDashboardPrometheusTimeRange } from '../model/time';
import { LabelNamesRequestParameters } from '../model/api-types';
import { useLabelNames } from '../model/prometheus-client';

type PrometheusLabelNames = VariableDefinition<LabelNamesOptions>;

interface LabelNamesOptions extends JsonObject {
  match: TemplateString[];
}

/**
 * Get variable option values by running a Prometheus label names query.
 */
export function usePrometheusLabelNames(
  definition: PrometheusLabelNames
): ReturnType<UseVariableOptionsHook<LabelNamesOptions>> {
  const { start, end } = useDashboardPrometheusTimeRange();
  const { result: match, needsVariableValuesFor } = useReplaceTemplateStrings(definition.options.match);

  // Make the request, pausing any requests that are still waiting on variable
  // values to be filled in/selected
  const request: LabelNamesRequestParameters = {
    'match[]': match,
    start,
    end,
  };
  const {
    data: response,
    isLoading: loading,
    error,
  } = useLabelNames(request, {
    enabled: needsVariableValuesFor.size === 0,
  });

  const data = response?.data ?? [];
  return {
    data: data,
    loading: loading || needsVariableValuesFor.size > 0,
    error: error ?? undefined,
  };
}
