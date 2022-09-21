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

import { Definition } from './definitions';

export type VariableName = string;

export type VariableValue = string | string[] | null;

interface VariableSpec {
  name: VariableName;
  display?: {
    label?: string;
    hidden?: boolean;
  };
  defaultValue?: VariableValue;
}

export interface TextVariableDefinition extends Definition<TextVariableSpec> {
  kind: 'TextVariable';
}

export interface TextVariableSpec extends VariableSpec {
  value: string;
}

export interface ListVariableDefinition<PluginSpec = unknown> extends Definition<ListVariableSpec<PluginSpec>> {
  kind: 'ListVariable';
}

export interface ListVariableSpec<PluginSpec> extends VariableSpec {
  allowMultiple?: boolean;
  allowAllValue?: boolean;
  customAllValue?: string;
  plugin: Definition<PluginSpec>;
}

export type VariableDefinition = TextVariableDefinition | ListVariableDefinition;
