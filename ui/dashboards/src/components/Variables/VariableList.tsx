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

import { useState } from 'react';
import { AppBar, Box, IconButton, SxProps, Theme, useScrollTrigger } from '@mui/material';
import PinOutline from 'mdi-material-ui/PinOutline';
import PinOffOutline from 'mdi-material-ui/PinOffOutline';
import { VariableDefinition } from '@perses-dev/core';
import { useTemplateVariableDefinitions } from '../../context';
import { TemplateVariable } from './Variable';

const VARIABLE_INPUT_MIN_WIDTH = '120px';
const VARIABLE_INPUT_MAX_WIDTH = '240px';

interface TemplateVariableListProps {
  initialVariableIsSticky?: boolean;
  sx?: SxProps<Theme>;
}

export function TemplateVariableList(props: TemplateVariableListProps) {
  const [isPin, setIsPin] = useState(props.initialVariableIsSticky);
  const variableDefinitions: VariableDefinition[] = useTemplateVariableDefinitions();

  const scrollTrigger = useScrollTrigger({ disableHysteresis: true });
  const isSticky = scrollTrigger && props.initialVariableIsSticky && isPin;

  return (
    // marginBottom={-1} counteracts the marginBottom={1} on every variable input.
    // The margin on the inputs is for spacing between inputs, but is not meant to add space to bottom of the container.
    <Box marginBottom={-1} data-testid="variable-list">
      <AppBar
        color="inherit"
        position={isSticky ? 'fixed' : 'static'}
        elevation={isSticky ? 4 : 0}
        sx={{ backgroundColor: 'inherit', ...props.sx }}
      >
        <Box display="flex" flexWrap="wrap" alignItems="start" my={isSticky ? 2 : 0} ml={isSticky ? 2 : 0}>
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
          {props.initialVariableIsSticky && (
            <IconButton onClick={() => setIsPin(!isPin)}>{isPin ? <PinOutline /> : <PinOffOutline />}</IconButton>
          )}
        </Box>
      </AppBar>
    </Box>
  );
}
