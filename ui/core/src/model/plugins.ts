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

import {
  TimeSeriesQueryDefinition,
  TimeSeriesQueryPlugin,
} from './time-series-query';
import { JsonObject } from './definitions';
import { PanelDefinition, PanelPlugin } from './panels';
import { ResourceMetadata } from './resource';
import { VariableDefinition, VariablePlugin } from './variables';

export interface PluginResource {
  kind: 'Plugin';
  metadata: ResourceMetadata;
  spec: PluginSpec;
}

export interface PluginSpec {
  supported_kinds: Record<string, PluginType>;
  // TODO: Is this how we should load 3rd party plugins from the Perses server?
  plugin_module_path: string;
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
export type RegisterPlugin = <Kind extends string, Options extends JsonObject>(
  config: PluginRegistrationConfig<Kind, Options>
) => void;

// Map of plugin type -> config and implementation type
type SupportedPlugins<Kind extends string, Options extends JsonObject> = {
  Variable: {
    Def: VariableDefinition<Kind, Options>;
    Impl: VariablePlugin<Kind, Options>;
  };
  Panel: {
    Def: PanelDefinition<Kind, Options>;
    Impl: PanelPlugin<Kind, Options>;
  };
  TimeSeriesQuery: {
    Def: TimeSeriesQueryDefinition<Kind, Options>;
    Impl: TimeSeriesQueryPlugin<Kind, Options>;
  };
};

/**
 * All supported plugin types.
 */
export type PluginType = keyof SupportedPlugins<string, JsonObject>;

/**
 * The definition handled for a given plugin type.
 */
export type PluginDefinition<
  Type extends PluginType,
  Kind extends string,
  Options extends JsonObject
> = SupportedPlugins<Kind, Options>[Type]['Def'];

/**
 * The implementation for a given plugin type.
 */
export type PluginImplementation<
  Type extends PluginType,
  Kind extends string,
  Options extends JsonObject
> = SupportedPlugins<Kind, Options>[Type]['Impl'];

/**
 * Configuration (including the plugin implementation) that's expected when
 * registering a plugin with Perses.
 */
export type PluginRegistrationConfig<
  Kind extends string,
  Options extends JsonObject
> = {
  [Type in keyof SupportedPlugins<Kind, Options>]: PluginConfig<
    Type,
    Kind,
    Options
  >;
}[PluginType];

/**
 * Configuration expected for a particular plugin type.
 */
export type PluginConfig<
  Type extends PluginType,
  Kind extends string,
  Options extends JsonObject
> = {
  pluginType: Type;
  kind: Kind;
  validate?: (config: AnyPluginDefinition<Type>) => string[];
  plugin: PluginImplementation<Type, Kind, Options>;
};

/**
 * A PluginDefinition at runtime where we know the plugin type, but not the
 * specific Kind/Options that it handles.
 */
export type AnyPluginDefinition<Type extends PluginType> = PluginDefinition<
  Type,
  string,
  JsonObject
>;

/**
 * A PluginImplementation at runtime where we know the plugin type, but not the
 * specific Kind/Options that it handles.
 */
export type AnyPluginImplementation<Type extends PluginType> =
  PluginImplementation<Type, string, JsonObject>;
