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

import { Display, TextVariableDefinition, VariableDefinition } from '@perses-dev/core';

export function getInitialState(initialVariableDefinition: VariableDefinition) {
  const textVariableFields = {
    value: (initialVariableDefinition as TextVariableDefinition).spec.value ?? '',
  };

  const listVariableFields = {
    allowMultiple: false,
    allowAll: false,
    capturing_regexp: undefined as string | undefined,
    plugin: {
      kind: '',
      spec: {},
    },
    customAllValue: undefined as string | undefined,
  };
  if (initialVariableDefinition.kind === 'ListVariable') {
    listVariableFields.allowMultiple = initialVariableDefinition.spec.allow_all_value ?? false;
    listVariableFields.allowAll = initialVariableDefinition.spec.allow_all_value ?? false;
    listVariableFields.capturing_regexp = initialVariableDefinition.spec.capturing_regexp;
    listVariableFields.plugin = initialVariableDefinition.spec.plugin;
    listVariableFields.customAllValue = initialVariableDefinition.spec.custom_all_value;
  }

  return {
    name: initialVariableDefinition.spec.name,
    title: initialVariableDefinition.spec.display?.name,
    kind: initialVariableDefinition.kind,
    description: initialVariableDefinition.spec.display?.description,
    listVariableFields,
    textVariableFields,
  };
}

export type VariableEditorState = ReturnType<typeof getInitialState>;

export function getVariableDefinitionFromState(state: VariableEditorState): VariableDefinition {
  const { name, title, kind, description } = state;

  let display: Display | undefined = title ? { name: title } : undefined;
  if (description) {
    if (display) {
      display.description = description;
    } else {
      // Name is mandatory if you want to add a description, autofilled by the metadata name if undefined
      display = { name: name, description: description };
    }
  }

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
        allow_multiple: state.listVariableFields.allowMultiple,
        allow_all_value: state.listVariableFields.allowAll,
        capturing_regexp: state.listVariableFields.capturing_regexp,
        plugin: state.listVariableFields.plugin,
        custom_all_value: state.listVariableFields.customAllValue,
      },
    };
  }
  throw new Error(`Unknown variable kind: ${kind}`);
}
