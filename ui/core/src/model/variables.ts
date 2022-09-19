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
  value: VariableValue;
  options?: VariableOption[];
  loading: boolean;
  error?: Error;
};

export type VariableOption = { label: string; value: string };

export type VariablesState = Record<VariableName, VariableState>;

export type VariableValue = string | string[] | null;

export interface Variable<Kind extends string, TOptions extends JsonObject = JsonObject> extends Definition<TOptions> {
  kind: Kind;
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

export type TextVariableDefintion = Variable<'TextVariable', TextVariableOptions>;

export type ListVariableOptions<Kind extends string, Options extends JsonObject> = {
  allowMultiple?: boolean;
  allowAllValue?: boolean;
  customAllValue?: string;
  optionsLoader: {
    kind: Kind;
    options: Options;
  };
};

export type ListVariableDefinition<Options extends JsonObject = JsonObject, Kind extends string = string> = Variable<
  'ListVariable',
  ListVariableOptions<Kind, Options>
>;

// All Variables
export type VariableDefinition = TextVariableDefintion | ListVariableDefinition;
export type VariableDefinitions = VariableDefinition[];
