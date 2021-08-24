import { usePluginRuntime } from '../context/PluginRuntimeContext';
import { DashboardSpec } from '../model/dashboard';
import { TimeRange } from '../model/time';

/**
 * Gets the spec for the current Dashboard.
 */
export function useDashboardSpec(): DashboardSpec {
  return usePluginRuntime('useDashboardSpec')();
}

/**
 * The value and options for a Dashboard variable.
 */
export interface VariableState {
  value: string | string[];
  options?: string[];
}

/**
 * Gets the variable values and options for the current Dashboard.
 */
export function useDashboardVariables(): Record<string, VariableState> {
  return usePluginRuntime('useDashboardVariables')();
}

/**
 * Gets the selected time range for the current Dashboard.
 */
export function useDashboardTimeRange(): TimeRange {
  return usePluginRuntime('useDashboardTimeRange')();
}
