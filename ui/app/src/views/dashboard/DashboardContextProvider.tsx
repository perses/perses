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

import { createContext, useContext, useMemo, useState } from 'react';
import {
  DashboardResource,
  AbsoluteTimeRange,
  toAbsoluteTimeRange,
} from '@perses-ui/core';
import { useVariablesState, VariablesState } from './variables';

export interface DashboardContextType {
  resource: DashboardResource;
  variables: VariablesState;
  timeRange: AbsoluteTimeRange;
}

export const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export interface DashboardContextProviderProps {
  resource: DashboardResource;
  children: React.ReactNode;
}

/**
 * Provides Dashboard-related state for a given DashboardResource.
 */
export function DashboardContextProvider(props: DashboardContextProviderProps) {
  const { resource, children } = props;

  const variables = useVariablesState(resource);

  const [timeRange] = useState<AbsoluteTimeRange>(
    toAbsoluteTimeRange({ pastDuration: resource.spec.duration })
  );

  const context: DashboardContextType = useMemo(
    () => ({
      resource,
      variables,
      timeRange,
    }),
    [resource, variables, timeRange]
  );

  return (
    <DashboardContext.Provider value={context}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('No Dashboard context found. Did you forget a Provider?');
  }
  return context;
}
