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

import { Box } from '@mui/material';
import { VariableDefinition, VariableSpec } from '@perses-dev/core';
import {
  ExternalVariableDefinition,
  useTemplateExternalVariableDefinitions,
  useTemplateVariable,
  useTemplateVariableDefinitions,
} from '../../context';
import { MAX_TEMPLATE_VARIABLE_WIDTH, MIN_TEMPLATE_VARIABLE_WIDTH } from '../../constants';
import { TemplateVariable } from './TemplateVariable';

export function TemplateVariableList() {
  const variableDefinitions: VariableDefinition[] = useTemplateVariableDefinitions();
  const externalVariableDefinitions: ExternalVariableDefinition[] = useTemplateExternalVariableDefinitions();

  return (
    <>
      {externalVariableDefinitions
        .slice()
        .reverse() // We reverse to have the most prioritized on top
        .map((def) =>
          def.definitions.map((v) => (
            <TemplateVariableListItem key={v.spec.name + def.source} spec={v.spec} source={def.source} />
          ))
        )}
      {variableDefinitions.map((v) => (
        <TemplateVariableListItem key={v.spec.name} spec={v.spec} />
      ))}
    </>
  );
}

export function TemplateVariableListItem({ spec, source }: { spec: VariableSpec; source?: string }) {
  const ctx = useTemplateVariable(spec.name, source);
  return (
    <Box
      key={spec.name + source ?? ''}
      display={ctx.state?.overridden || spec.display?.hidden ? 'none' : undefined}
      minWidth={`${MIN_TEMPLATE_VARIABLE_WIDTH}px`}
      maxWidth={MAX_TEMPLATE_VARIABLE_WIDTH + 'px'}
      flexShrink={0}
      data-testid={'template-variable-' + spec.name}
    >
      <TemplateVariable key={spec.name + source ?? ''} name={spec.name} source={source} />
    </Box>
  );
}
