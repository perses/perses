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

import { Definition, JsonObject } from './definitions';
import { AnyPluginDefinition, AnyPluginImplementation } from './plugins';

export interface PanelDefinition<Kind extends string, Options extends JsonObject> extends Definition<Kind, Options> {
  display: {
    name: string;
  };
}

/**
 * Plugin the provides custom visualizations inside of a Panel.
 */
export interface PanelPlugin<Kind extends string, Options extends JsonObject> {
  PanelComponent: PanelComponent<Kind, Options>;
}

export type PanelComponent<Kind extends string, Options extends JsonObject> = React.ComponentType<
  PanelProps<Kind, Options>
>;

export interface PanelProps<Kind extends string, Options extends JsonObject> {
  definition: PanelDefinition<Kind, Options>;
}

export type AnyPanelDefinition = AnyPluginDefinition<'Panel'>;

export type AnyPanelPlugin = AnyPluginImplementation<'Panel'>;
