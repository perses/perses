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

import { useState } from 'react';
import { Button, Stack, Box, Drawer, AppBar, useScrollTrigger } from '@mui/material';
import EyeIcon from 'mdi-material-ui/Eye';
import PencilIcon from 'mdi-material-ui/Pencil';

import { useTemplateVariableDefinitions, useEditMode, useTemplateVariableActions } from '../../context';
import { TemplateVariable } from './Variable';
import { VariableEditor } from './VariableEditor';

export function TemplateVariableList() {
  const [isEditing, setIsEditing] = useState(false);
  const variableDefinitions = useTemplateVariableDefinitions();
  const { isEditMode } = useEditMode();
  const [showVariablesInEditMode, setShowVariablesInEditMode] = useState(true);
  const showVariables = isEditMode ? showVariablesInEditMode : true;
  const { setVariableDefinitions } = useTemplateVariableActions();
  const trigger = useScrollTrigger({ disableHysteresis: true });

  return (
    <Box>
      <Drawer anchor={'right'} open={isEditing}>
        <VariableEditor
          onCancel={() => {
            setIsEditing(false);
          }}
          variableDefinitions={variableDefinitions}
          onChange={(v) => {
            setVariableDefinitions(v);
            setIsEditing(false);
          }}
        />
      </Drawer>
      {isEditMode && (
        <Box pb={2}>
          <Button onClick={() => setShowVariablesInEditMode(!showVariablesInEditMode)} startIcon={<EyeIcon />}>
            {showVariablesInEditMode ? 'Hide' : 'Show'} Variables
          </Button>
          <Button onClick={() => setIsEditing(true)} startIcon={<PencilIcon />}>
            Edit Variables
          </Button>
        </Box>
      )}

      <AppBar color={'inherit'} position={trigger ? 'fixed' : 'static'} elevation={trigger ? 4 : 0}>
        <Box display={'flex'} justifyContent="space-between" my={trigger ? 2 : 0} ml={trigger ? 2 : 0}>
          <Stack direction={'row'} spacing={2}>
            {showVariables &&
              variableDefinitions.map((v) => (
                <Box key={v.spec.name} display={v.spec.display?.hidden ? 'none' : undefined}>
                  <TemplateVariable key={v.spec.name} name={v.spec.name} />
                </Box>
              ))}
          </Stack>
        </Box>
      </AppBar>
    </Box>
  );
}
