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
