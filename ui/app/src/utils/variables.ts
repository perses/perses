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

import { ExternalVariableDefinition } from '@perses-dev/dashboards';
import { VariableResource } from '@perses-dev/core';
import { ExternalVariableSource } from '../model/variables';

/**
 * Build the definition of the external variables from the variable resources collected from the API.
 * @param source the source of external variables. Used in view only, to display and discriminate from other sources.
 * @param variables variable resources collected from the API
 */
export function buildExternalVariableDefinition(
  source: ExternalVariableSource,
  variables: VariableResource[]
): ExternalVariableDefinition {
  return {
    source: source,
    definitions: variables.map((v) => {
      const definition = { ...v.spec };
      // The name of the variable resource can be missing from the spec but present in the metadata.
      // We ensure that the metadata.name is used.
      // We do this only if not already defined as otherwise, it's readonly
      if (!definition.spec.name) {
        definition.spec.name = v.metadata.name;
      }
      return definition;
    }),
  };
}
