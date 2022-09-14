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

export const DEFAULT_ALL_VALUE = '$__all' as const;

export type VariableName = string;

export type VariableState = {
  name: VariableName;
  value: VariableValue;
  options?: VariableOption[];
  loading: boolean;
  error?: Error | null;
};

export type VariableOption = { label: string; value: string };

export type VariablesState = Record<VariableName, VariableState>;

export type VariableValue = string | string[] | null;

export interface IVariable<TKind extends string, TOptions extends JsonObject = JsonObject>
  extends Definition<TOptions> {
  kind: TKind;
  name: VariableName;
  display?: {
    label?: string;
    hidden?: boolean;
  };
  defaultValue?: VariableValue;
  options: TOptions;
}

export interface TextVariableOptions extends JsonObject {
  value: string;
}

export type TextVariableDefintion = IVariable<'TextVariable', TextVariableOptions>;

export type ListVariableOptions<TKind extends string, TOptions extends JsonObject> = {
  allowMultiple?: boolean;
  allowAllValue?: boolean;
  customAllValue?: string;
  kind: TKind;
  options: TOptions;
};

export type ListVariableDefinition<TOptions extends JsonObject = JsonObject, TKind extends string = string> = IVariable<
  'ListVariable',
  ListVariableOptions<TKind, TOptions>
>;

// All Variables
export type VariableDefinition = TextVariableDefintion | ListVariableDefinition;
export type VariableDefinitions = VariableDefinition[];
