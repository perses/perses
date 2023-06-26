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
import { VariableDefinition } from '@perses-dev/core';
import { useTemplateVariableDefinitions } from '../../context';
import { TemplateVariable } from './TemplateVariable';

const VARIABLE_INPUT_MIN_WIDTH = '120px';
const VARIABLE_INPUT_MAX_WIDTH = '240px';

export function TemplateVariableList() {
  const variableDefinitions: VariableDefinition[] = useTemplateVariableDefinitions();

  return (
    <>
      {variableDefinitions.map((v) => (
        <Box
          key={v.spec.name}
          display={v.spec.display?.hidden ? 'none' : undefined}
          minWidth={VARIABLE_INPUT_MIN_WIDTH}
          maxWidth={VARIABLE_INPUT_MAX_WIDTH}
          marginBottom={1}
          marginRight={1}
          data-testid="template-variable"
        >
          <TemplateVariable key={v.spec.name} name={v.spec.name} />
        </Box>
      ))}
    </>
  );
}
