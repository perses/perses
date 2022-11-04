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

import { VariableDefinition, TextVariableDefinition, ListVariableDefinition, Display } from '@perses-dev/core';

export function getInitialState(initialVariableDefinition: VariableDefinition) {
  const textVariableFields = {
    value: (initialVariableDefinition as TextVariableDefinition).spec.value ?? '',
  };

  const listVariableFields = {
    allowMultiple: false,
    allowAll: false,
    plugin: {
      kind: '',
      spec: {},
    },
  };
  if (initialVariableDefinition.kind === 'ListVariable') {
    listVariableFields.allowMultiple = initialVariableDefinition.spec.allow_all_value ?? false;
    listVariableFields.allowAll = initialVariableDefinition.spec.allow_all_value ?? false;
    listVariableFields.plugin = initialVariableDefinition.spec.plugin;
  }

  return {
    name: initialVariableDefinition.spec.name,
    title: initialVariableDefinition.spec.display?.name,
    kind: initialVariableDefinition.kind,
    description: '',
    listVariableFields,
    textVariableFields,
  };
}

export type VariableEditorState = ReturnType<typeof getInitialState>;

export function getVariableDefinitionFromState(state: VariableEditorState): VariableDefinition {
  const { name, title, kind } = state;

  const commonSpec = {
    name,
    display: {
      name: title,
    } as Display,
  };

  if (kind === 'TextVariable') {
    const textVariableDefinition: TextVariableDefinition = {
      kind,
      spec: {
        ...commonSpec,
        ...state.textVariableFields,
      },
    };
    return textVariableDefinition;
  }

  if (kind === 'ListVariable') {
    const listVariableDefinition: ListVariableDefinition = {
      kind,
      spec: {
        ...commonSpec,
        allow_multiple: state.listVariableFields.allowMultiple,
        allow_all_value: state.listVariableFields.allowAll,
        plugin: state.listVariableFields.plugin,
      },
    };

    return listVariableDefinition;
  }
  throw new Error(`Unknown variable kind: ${kind}`);
}
