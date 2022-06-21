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

import { DashboardSpec, PanelRef } from '../model';

/**
 * Resolve a PanelRef (JSON reference) against the provided DashboardSpec to
 * a PanelDefinition.
 */
export function resolvePanelRef(spec: DashboardSpec, panelRef: PanelRef) {
  const panelsKey = panelRef.$ref.substring(14);
  const panelDefinition = spec.panels[panelsKey];
  if (panelDefinition === undefined) {
    throw new Error(`Could not resolve panels reference ${panelRef.$ref}`);
  }
  return panelDefinition;
}
