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
import { QueryDefinition } from './query';

export type LinkIcon =
  | 'external-link'
  | 'dashboard-link'
  | 'info-link'
  | 'question-link'
  | 'danger-link'
  | 'bolt-link'
  | 'download-link'
  | 'settings-link';

export interface Link {
  name?: string;
  url: string;
  tooltip?: string;
  icon?: LinkIcon;
  renderVariables?: boolean;
  targetBlank?: boolean;
}

export interface PanelDisplay {
  name: string;
  description?: string;
  links?: Link[];
}

export interface PanelDefinition<PluginSpec = UnknownSpec> extends Definition<PanelSpec<PluginSpec>> {
  kind: 'Panel';
}

export interface PanelSpec<PluginSpec> {
  display: PanelDisplay;
  plugin: Definition<PluginSpec>;
  queries?: QueryDefinition[];
}

/**
 * A reference to a panel defined in the DashboardSpec.
 */
export interface PanelRef {
  $ref: `#/spec/panels/${string}`;
}
