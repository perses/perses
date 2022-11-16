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

import React, { useState } from 'react';
import { Button, Stack, Box, Drawer, AppBar, useScrollTrigger, IconButton } from '@mui/material';
import EyeIcon from 'mdi-material-ui/Eye';
import PencilIcon from 'mdi-material-ui/Pencil';
import PinOutline from 'mdi-material-ui/PinOutline';
import PinOffOutline from 'mdi-material-ui/PinOffOutline';
import { useTemplateVariableDefinitions, useEditMode, useTemplateVariableActions } from '../../context';
import { TemplateVariable } from './Variable';
import { VariableEditor } from './VariableEditor';

interface TemplateVariableListProps {
  initialVariableIsSticky?: boolean;
}

export function TemplateVariableList(props: TemplateVariableListProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPin, setIsPin] = useState(props.initialVariableIsSticky);
  const variableDefinitions = useTemplateVariableDefinitions();
  const { isEditMode } = useEditMode();
  const [showVariablesInEditMode, setShowVariablesInEditMode] = useState(true);
  const showVariables = isEditMode ? showVariablesInEditMode : true;
  const { setVariableDefinitions } = useTemplateVariableActions();
  const scrollTrigger = useScrollTrigger({ disableHysteresis: true });
  const isSticky = scrollTrigger && props.initialVariableIsSticky && isPin;
  return (
    <Box>
      <Drawer anchor={'right'} open={isEditing} PaperProps={{ sx: { width: '50%' } }}>
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

      <AppBar color={'inherit'} position={isSticky ? 'fixed' : 'static'} elevation={isSticky ? 4 : 0}>
        <Box display={'flex'} justifyContent="space-between" my={isSticky ? 2 : 0} ml={isSticky ? 2 : 0}>
          <Stack direction={'row'} spacing={2}>
            {showVariables &&
              variableDefinitions.map((v) => (
                <Box key={v.spec.name} display={v.spec.display?.hidden ? 'none' : undefined}>
                  <TemplateVariable key={v.spec.name} name={v.spec.name} />
                </Box>
              ))}
          </Stack>
          {props.initialVariableIsSticky && (
            <IconButton onClick={() => setIsPin(!isPin)}>{isPin ? <PinOutline /> : <PinOffOutline />}</IconButton>
          )}
        </Box>
      </AppBar>
    </Box>
  );
}
