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

import { JsonObject, PanelDefinition } from '@perses-dev/core';
import { usePlugin } from '../components/PluginLoadingBoundary';
import { InitialOptionsCallback, OptionsEditor } from './visual-editing';

/**
 * Plugin the provides custom visualizations inside of a Panel.
 */
export interface PanelPlugin<Options extends JsonObject = JsonObject> {
  PanelComponent: React.ComponentType<PanelProps<Options>>;
  OptionsEditorComponent: OptionsEditor<Options>;
  createInitialOptions: InitialOptionsCallback<Options>;
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
 * Hook for using a panel plugin at runtime.
 */
export function usePanelPlugin(kind: string): PanelPlugin<JsonObject> {
  const plugin = usePlugin('Panel', kind);
  if (plugin !== undefined) {
    return plugin;
  }

  // Return a default/placeholder plugin while loading happens
  return defaultPanelPlugin;
}

const defaultPanelPlugin: PanelPlugin<JsonObject> = {
  PanelComponent: () => null,
  OptionsEditorComponent: () => null,
  createInitialOptions: () => ({}),
};
