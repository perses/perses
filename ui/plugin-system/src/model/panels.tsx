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

import { JsonObject, Definition, DashboardSpec } from '@perses-dev/core';
import { usePlugin } from '../components/PluginLoadingBoundary';

declare module '@perses-dev/core' {
  // Extend the core DashboardSpec to support panel definitions from panel plugins
  interface DashboardSpec {
    panels: Record<string, PanelDefinition>;
  }

  // Extend the core GridItem layout spec to support panels from plugins as content
  interface GridItemDefinition {
    content: PanelRef;
  }
}

/**
 * Panel definition options that are common to all panels.
 */
export interface PanelDefinition<Options extends JsonObject = JsonObject> extends Definition<Options> {
  display: {
    name: string;
  };
}

/**
 * A reference to a panel defined in the DashboardSpec.
 */
export interface PanelRef {
  $ref: `#/panels/${string}`;
}

/**
 * Resolve a PanelRef (JSON reference) against the provided DashboardSpec to
 * a PanelDefinition.
 */
export function resolvePanelRef(spec: DashboardSpec, panelRef: PanelRef) {
  const panelsKey = panelRef.$ref.substring(9);
  const panelDefinition = spec.panels[panelsKey];
  if (panelDefinition === undefined) {
    throw new Error(`Could not resolve panels reference ${panelRef.$ref}`);
  }
  return panelDefinition;
}

/**
 * Plugin the provides custom visualizations inside of a Panel.
 */
export interface PanelPlugin<Options extends JsonObject = JsonObject> {
  PanelComponent: React.ComponentType<PanelProps<Options>>;
}

/**
 * The props provided by Perses to a panel plugin's PanelComponent.
 */
export interface PanelProps<Options extends JsonObject> {
  definition: PanelDefinition<Options>;
  contentDimensions?: {
    width: number;
    height: number;
  };
}

/**
 * Renders a PanelComponent from a panel plugin at runtime.
 */
export const PanelComponent: PanelPlugin['PanelComponent'] = (props) => {
  const plugin = usePlugin('Panel', props.definition);
  if (plugin === undefined) {
    return null;
  }
  const { PanelComponent: PluginComponent } = plugin;
  return <PluginComponent {...props} />;
};
