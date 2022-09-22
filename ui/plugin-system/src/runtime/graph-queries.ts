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

import { GraphQueryDefinition } from '@perses-dev/core';
import { useQuery } from 'react-query';
import { GraphQueryContext } from '../model';
import { useLegacyDatasources } from './datasources-old';
import { useTemplateVariableValues } from './template-variables';
import { useTimeRange } from './time-range';
import { usePlugin } from './plugins';

type UseGraphQueryOptions = {
  suggestedStepMs?: number;
};

/**
 * Runs a Graph Query using a plugin and returns the results.
 */
export const useGraphQueryData = (definition: GraphQueryDefinition, options?: UseGraphQueryOptions) => {
  const { data: plugin } = usePlugin('GraphQuery', definition.spec.plugin.kind);

  // Build the context object from data available at runtime
  const { timeRange } = useTimeRange();
  const variableState = useTemplateVariableValues();
  const datasources = useLegacyDatasources();

  const context: GraphQueryContext = {
    suggestedStepMs: options?.suggestedStepMs,
    timeRange,
    variableState,
    datasources,
  };

  const key = [definition, context] as const;
  const { data, isLoading, error } = useQuery(
    key,
    ({ queryKey }) => {
      // The 'enabled' option should prevent this from happening, but make TypeScript happy by checking
      if (plugin === undefined) {
        throw new Error('Expected plugin to be loaded');
      }
      const [definition, context] = queryKey;
      return plugin.getGraphData(definition, context);
    },
    { enabled: plugin !== undefined }
  );

  // TODO: Stop aliasing fields, just return the hook results directly once we clean up query running in panels
  return { data, loading: isLoading, error: error ?? undefined };
};
