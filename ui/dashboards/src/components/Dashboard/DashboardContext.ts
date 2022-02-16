import { AbsoluteTimeRange, DashboardSpec } from '@perses-dev/core';
import { createContext, useContext } from 'react';

export interface DashboardContextType {
  spec: DashboardSpec;
  timeRange: AbsoluteTimeRange;
  variables: Record<string, VariableState>;
}

/**
 * The value and options for a Dashboard variable.
 */
export interface VariableState {
  value: string | string[];
  options?: string[];
}

export const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

/**
 * Gets the context provided by the Dashboard component.
 */
export function useDashboardContext() {
  const ctx = useContext(DashboardContext);
  if (ctx === undefined) {
    throw new Error('No DashboardContext found. Did you forget a Provider?');
  }
  return ctx;
}
