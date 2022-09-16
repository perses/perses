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

import { JsonObject, ResourceMetadata, ListVariableDefinition, PanelDefinition } from '@perses-dev/core';
import { GraphQueryDefinition, GraphQueryPlugin } from './graph-queries';
import { PanelPlugin } from './panels';
import { VariablePlugin } from './variables';

/**
 * Information about a module/package that contains plugins.
 */
export interface PluginModuleResource {
  kind: 'PluginModule';
  metadata: ResourceMetadata;
  spec: PluginSpec;
}

export interface PluginSpec {
  plugins: PluginMetadata[];
}

/**
 * Metadata about an individual plugin that's part of a PluginModule.
 */
export interface PluginMetadata {
  pluginType: PluginType;
  kind: string;
  display: {
    name: string;
    description?: string;
  };
}

/**
 * All supported plugin type values as an array for use at runtime.
 */
export const ALL_PLUGIN_TYPES = ['Variable', 'Panel', 'GraphQuery'] as const;

/**
 * All supported plugin types.
 */
export type PluginType = typeof ALL_PLUGIN_TYPES[number];

// Map of plugin type -> config and implementation type
type SupportedPlugins<Options extends JsonObject> = {
  Variable: {
    Def: ListVariableDefinition<Options>;
    Impl: VariablePlugin<Options>;
  };
  Panel: {
    Def: PanelDefinition<Options>;
    Impl: PanelPlugin<Options>;
  };
  GraphQuery: {
    Def: GraphQueryDefinition<Options>;
    Impl: GraphQueryPlugin<Options>;
  };
};

/**
 * Union type of all available plugin implementations.
 */
export type Plugin<Options extends JsonObject> = {
  [Type in PluginType]: PluginImplementation<Type, Options>;
}[PluginType];

/**
 * The implementation for a given plugin type.
 */
export type PluginImplementation<
  Type extends PluginType,
  Options extends JsonObject
> = SupportedPlugins<Options>[Type]['Impl'];
