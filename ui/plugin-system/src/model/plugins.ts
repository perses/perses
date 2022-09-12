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

import { JsonObject, ResourceMetadata, VariableDefinition, PanelDefinition } from '@perses-dev/core';
import { GraphQueryDefinition, GraphQueryPlugin } from './graph-queries';
import { PanelPlugin } from './panels';
import { VariablePlugin } from './variables';

export interface PluginResource {
  kind: 'Plugin';
  metadata: ResourceMetadata;
  spec: PluginSpec;
}

export interface PluginSpec {
  supported_kinds: Record<string, PluginType>;
}

/**
 * A JavaScript module with Perses plugins.
 */
export interface PluginModule {
  setup: PluginSetupFunction;
}

/**
 * When a PluginModule is loaded, this function is called to allow the module
 * to register plugins with Perses.
 */
export type PluginSetupFunction = (registerPlugin: RegisterPlugin) => void;

/**
 * Callback function that registers a plugin with Perses.
 */
export type RegisterPlugin = <Options extends JsonObject>(config: PluginRegistrationConfig<Options>) => void;

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
    Def: VariableDefinition<Options>;
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
 * The definition handled for a given plugin type.
 */
export type PluginDefinition<
  Type extends PluginType,
  Options extends JsonObject
> = SupportedPlugins<Options>[Type]['Def'];

/**
 * The implementation for a given plugin type.
 */
export type PluginImplementation<
  Type extends PluginType,
  Options extends JsonObject
> = SupportedPlugins<Options>[Type]['Impl'];

/**
 * Configuration (including the plugin implementation) that's expected when
 * registering a plugin with Perses.
 */
export type PluginRegistrationConfig<Options extends JsonObject> = {
  [Type in PluginType]: PluginConfig<Type, Options>;
}[PluginType];

/**
 * Configuration expected for a particular plugin type.
 */
export type PluginConfig<Type extends PluginType, Options extends JsonObject> = {
  pluginType: Type;
  kind: string;
  plugin: PluginImplementation<Type, Options>;
};
