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

import { createContext, useContext, useRef } from 'react';
import { useChartQuery } from '../hooks/chart';
import {
  useDashboardSpec,
  useDashboardTimeRange,
  useDashboardVariables,
} from '../hooks/dashboard';
import { useDataSources } from '../hooks/datasource';
import { usePanelState } from '../hooks/panel';

/**
 * Hooks exposed to plugins at runtime. This is so we don't have to put
 * implementation details here in core (i.e. a plugin doesn't need to worry
 * about whether these are using Context, Redux, etc).
 */
export interface PluginRuntime {
  useDashboardSpec: typeof useDashboardSpec;
  useDashboardVariables: typeof useDashboardVariables;
  useDashboardTimeRange: typeof useDashboardTimeRange;
  useDataSources: typeof useDataSources;
  useChartQuery: typeof useChartQuery;
  usePanelState: typeof usePanelState;
}

export const PluginRuntimeContext = createContext<PluginRuntime | undefined>(
  undefined
);

export interface PluginRuntimeProviderProps {
  value: PluginRuntime;
  children: React.ReactNode;
}

export function PluginRuntimeProvider(props: PluginRuntimeProviderProps) {
  // Initialize once, then always pass the same value down so we don't have
  // the possibility of hook implementations changing (i.e. conditional hooks)
  const context = useRef<PluginRuntime | undefined>();
  if (context.current === undefined) {
    context.current = props.value;
  }

  return (
    <PluginRuntimeContext.Provider value={context.current}>
      {props.children}
    </PluginRuntimeContext.Provider>
  );
}

export function usePluginRuntime<T extends keyof PluginRuntime>(
  hook: T
): PluginRuntime[T] {
  const context = useContext(PluginRuntimeContext);
  if (context === undefined) {
    throw new Error(
      'Could not find ExposeToPlugin context. Did you forget a provider?'
    );
  }
  return context[hook];
}
