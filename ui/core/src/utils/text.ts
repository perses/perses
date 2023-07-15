// Copyright 2023 The Perses Authors
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

import { DashboardResource, VariableResource } from '../model';

/**
 * If the dashboard has a display name, return the dashboard display name
 * Else, only return the dashboard name
 * @param dashboard
 */
export function getDashboardDisplayName(dashboard: DashboardResource) {
  return dashboard.spec.display?.name ?? dashboard.metadata.name;
}

/**
 * If the variable has a display name, return the variable display name
 * Else, only return the variable name
 * @param variable Project or Global variable
 */
export function getVariableDisplayName(variable: VariableResource) {
  return variable.spec.spec.display?.name ?? variable.metadata.name;
}

/**
 * If the dashboard has a display name, return the dashboard display name and the dashboard name
 * Else, only return the dashboard name
 * @param dashboard
 */
export function getDashboardExtendedDisplayName(dashboard: DashboardResource) {
  if (dashboard.spec.display?.name) {
    return `${dashboard.spec.display.name} (Name: ${dashboard.metadata.name})`;
  }
  return dashboard.metadata.name;
}

/**
 * If the variable has a display name, return the variable display name and the variable name
 * Else, only return the variable name
 * @param variable Project or Global variable
 */
export function getVariableExtendedDisplayName(variable: VariableResource) {
  if (variable.spec.spec.display?.name) {
    return `${variable.spec.spec.display.name} (Name: ${variable.metadata.name})`;
  }
  return variable.metadata.name;
}
