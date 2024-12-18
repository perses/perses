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

import { ListVariableSpec, TextVariableDefinition, TextVariableSpec, VariableDefinition } from '@perses-dev/core';

export type VariableEditorState = {
  name: string;
  title?: string;
  kind: 'TextVariable' | 'ListVariable' | 'BuiltinVariable';
  description?: string;
  listVariableFields: Omit<ListVariableSpec, 'name' | 'display'>;
  textVariableFields: Omit<TextVariableSpec, 'name' | 'display'>;
};

export function getInitialState(initialVariableDefinition: VariableDefinition): VariableEditorState {
  const textVariableFields: Omit<TextVariableSpec, 'name' | 'display'> = {
    value: (initialVariableDefinition as TextVariableDefinition).spec.value ?? '',
    constant: (initialVariableDefinition as TextVariableDefinition).spec.constant ?? false,
  };

  const listVariableFields: Omit<ListVariableSpec, 'name' | 'display'> = {
    allowMultiple: false,
    allowAllValue: false,
    customAllValue: undefined,
    capturingRegexp: undefined,
    sort: undefined,
    plugin: {
      kind: '',
      spec: {},
    },
  };
  if (initialVariableDefinition.kind === 'ListVariable') {
    listVariableFields.allowMultiple = initialVariableDefinition.spec.allowMultiple ?? false;
    listVariableFields.allowAllValue = initialVariableDefinition.spec.allowAllValue ?? false;
    listVariableFields.customAllValue = initialVariableDefinition.spec.customAllValue;
    listVariableFields.capturingRegexp = initialVariableDefinition.spec.capturingRegexp;
    listVariableFields.sort = initialVariableDefinition.spec.sort;
    listVariableFields.plugin = initialVariableDefinition.spec.plugin;
  }

  return {
    name: initialVariableDefinition.spec.name,
    title: initialVariableDefinition.spec.display?.name ?? '',
    kind: initialVariableDefinition.kind,
    description: initialVariableDefinition.spec.display?.description ?? '',
    listVariableFields,
    textVariableFields,
  };
}

export function getVariableDefinitionFromState(state: VariableEditorState): VariableDefinition {
  const { name, title, kind, description } = state;

  const display = { name: title, description: description };

  if (kind === 'TextVariable') {
    return {
      kind,
      spec: {
        name,
        display,
        ...state.textVariableFields,
      },
    };
  }

  if (kind === 'ListVariable') {
    return {
      kind,
      spec: {
        name,
        display,
        allowMultiple: state.listVariableFields.allowMultiple,
        allowAllValue: state.listVariableFields.allowAllValue,
        customAllValue: state.listVariableFields.customAllValue,
        capturingRegexp: state.listVariableFields.capturingRegexp,
        sort: state.listVariableFields.sort,
        plugin: state.listVariableFields.plugin,
      },
    };
  }
  throw new Error(`Unknown variable kind: ${kind}`);
}
