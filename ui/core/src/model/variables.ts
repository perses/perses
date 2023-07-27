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
import { ProjectMetadata } from './resource';

export type VariableName = string;

export type VariableValue = string | string[] | null;

export interface VariableSpec {
  name: VariableName;
  display?: Display & {
    hidden?: boolean;
  };
}

export interface TextVariableDefinition extends Definition<TextVariableSpec> {
  kind: 'TextVariable';
}

export interface TextVariableSpec extends VariableSpec {
  value: string;
}

export interface ListVariableDefinition<PluginSpec = UnknownSpec> extends Definition<ListVariableSpec<PluginSpec>> {
  kind: 'ListVariable';
}

export interface ListVariableSpec<PluginSpec> extends VariableSpec {
  default_value?: VariableValue;
  allow_multiple?: boolean;
  allow_all_value?: boolean;
  custom_all_value?: string;
  capturing_regexp?: string;
  plugin: Definition<PluginSpec>;
}

export type VariableDefinition = TextVariableDefinition | ListVariableDefinition;

/**
 * A variable that belongs to a project.
 */
export interface VariableResource {
  kind: 'Variable';
  metadata: ProjectMetadata;
  spec: VariableDefinition;
}

export const DEFAULT_ALL_VALUE = '$__all' as const;
