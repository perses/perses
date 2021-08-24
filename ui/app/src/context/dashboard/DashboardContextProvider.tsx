import { createContext, useContext, useMemo, useState } from 'react';
import { DashboardResource, TimeRange } from '@perses-ui/core';
import { useVariablesState, VariablesState } from './variables';

export interface DashboardContextType {
  resource: DashboardResource;
  variables: VariablesState;
  timeRange: TimeRange;
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

  const [timeRange] = useState<TimeRange>({
    pastDuration: resource.spec.duration,
  });

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
