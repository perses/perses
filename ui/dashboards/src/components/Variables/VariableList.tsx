// Copyright 2024 The Perses Authors
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

import { Box } from '@mui/material';
import { VariableDefinition, VariableSpec } from '@perses-dev/core';
import {
  ExternalVariableDefinition,
  useExternalVariableDefinitions,
  useVariable,
  useVariableDefinitions,
} from '../../context';
import { MAX_VARIABLE_WIDTH, MIN_VARIABLE_WIDTH } from '../../constants';
import { Variable } from './Variable';

export function VariableList() {
  const variableDefinitions: VariableDefinition[] = useVariableDefinitions();
  const externalVariableDefinitions: ExternalVariableDefinition[] = useExternalVariableDefinitions();

  return (
    <>
      {externalVariableDefinitions
        .slice()
        .reverse() // We reverse to have the most prioritized on top
        .map((def) =>
          def.definitions.map((v) => (
            <VariableListItem key={v.spec.name + def.source} spec={v.spec} source={def.source} />
          ))
        )}
      {variableDefinitions.map((v) => (
        <VariableListItem key={v.spec.name} spec={v.spec} />
      ))}
    </>
  );
}

export function VariableListItem({ spec, source }: { spec: VariableSpec; source?: string }) {
  const ctx = useVariable(spec.name, source);
  if (ctx.state?.overridden) {
    return null;
  }
  return (
    <Box
      key={spec.name + source ?? ''}
      display={spec.display?.hidden ? 'none' : undefined}
      minWidth={`${MIN_VARIABLE_WIDTH}px`}
      maxWidth={`${MAX_VARIABLE_WIDTH}px`}
      flexShrink={0}
      data-testid={'variable-' + spec.name}
    >
      <Variable key={spec.name + source ?? ''} name={spec.name} source={source} />
    </Box>
  );
}
