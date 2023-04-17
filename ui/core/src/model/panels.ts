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

import { Definition, UnknownSpec } from './definitions';
import { Display } from './display';
import { QueryDefinition } from './query';
export interface PanelDefinition<PluginSpec = UnknownSpec> extends Definition<PanelSpec<PluginSpec>> {
  kind: 'Panel';
}

export interface PanelSpec<PluginSpec> {
  display: Display;
  plugin: Definition<PluginSpec>;
  queries?: QueryDefinition[];
}

/**
 * A reference to a panel defined in the DashboardSpec.
 */
export interface PanelRef {
  $ref: `#/spec/panels/${string}`;
}
