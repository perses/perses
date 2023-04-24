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

import { Metadata, UnknownSpec } from '@perses-dev/core';
import { TimeSeriesQueryPlugin } from './time-series-queries';
import { PanelPlugin } from './panels';
import { VariablePlugin } from './variables';
import { DatasourcePlugin } from './datasource';
import { Plugin } from './plugin-base';

/**
 * Information about a module/package that contains plugins.
 */
export interface PluginModuleResource {
  kind: 'PluginModule';
  metadata: Metadata;
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
 * All supported plugin types. A plugin's implementation must extend from `Plugin<UnknownSpec>` to be considered a valid
 * `PluginType`.
 */
export type PluginType = {
  // Filter out implementations on SupportedPlugins that don't extend `Plugin<UnknownSpec>`
  [K in keyof SupportedPlugins]: SupportedPlugins[K] extends Plugin<UnknownSpec> ? K : never;
}[keyof SupportedPlugins];

/**
 * Map of plugin type key/string -> implementation type. Use Typescript module augmentation to extend the plugin system
 * with new plugin types.
 */
export interface SupportedPlugins {
  Variable: VariablePlugin;
  Panel: PanelPlugin;
  TimeSeriesQuery: TimeSeriesQueryPlugin;
  Datasource: DatasourcePlugin;
}

/**
 * The implementation for a given plugin type.
 */
export type PluginImplementation<Type extends PluginType> = SupportedPlugins[Type];

/**
 * Default plugin kinds by plugin type.
 */
type PluginKinds = Partial<Record<PluginType, string>>;
export type DefaultPluginKinds = Required<Pick<PluginKinds, 'TimeSeriesQuery'>> & Omit<PluginKinds, 'TimeSeriesQuery'>;
