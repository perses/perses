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
import {
  Button,
  Stack,
  Box,
  Drawer,
  TableContainer,
  TableBody,
  TableRow,
  TableCell,
  Table,
  Paper,
  TableHead,
  Switch,
  Typography,
  IconButton,
} from '@mui/material';
import { VariableDefinition } from '@perses-dev/core';
import { useImmer } from 'use-immer';
import EyeIcon from 'mdi-material-ui/Eye';
import PencilIcon from 'mdi-material-ui/Pencil';
import TrashIcon from 'mdi-material-ui/TrashCan';

import { useTemplateVariableDefinitions, useEditMode, useTemplateVariableActions } from '../../context';
import { TemplateVariable } from './Variable';
import { VariableEditForm } from './VariableEditorForm';

function VariableEditor(props: {
  variableDefinitions: VariableDefinition[];
  onChange: (variableDefinitions: VariableDefinition[]) => void;
  onCancel: () => void;
}) {
  const [variableDefinitions, setVariableDefinitions] = useImmer(props.variableDefinitions);
  const [variableEditIdx, setVariableEditIdx] = useState<number | null>(null);

  const currentEditingVariableDefinition = typeof variableEditIdx === 'number' && variableDefinitions[variableEditIdx];

  const removeVariable = (index: number) => {
    setVariableDefinitions((draft) => {
      draft.splice(index, 1);
    });
  };

  const addVariable = () => {
    setVariableDefinitions((draft) => {
      draft.push({
        kind: 'TextVariable',
        spec: {
          name: 'NewVariable',
          value: '',
        },
      });
    });
  };

  const toggleVariableVisibility = (index: number, visible: boolean) => {
    setVariableDefinitions((draft) => {
      const v = draft[index];
      if (!v) {
        return;
      }
      if (!v.spec.display) {
        v.spec.display = {
          hidden: false,
        };
      }
      v.spec.display.hidden = visible === false;
    });
  };

  return (
    <Box p={4}>
      {currentEditingVariableDefinition && (
        <>
          <Typography variant="h3" mb={2}>
            Edit Variable
          </Typography>
          <VariableEditForm
            initialVariableDefinition={currentEditingVariableDefinition}
            onChange={(definition) => {
              setVariableDefinitions((draft) => {
                draft[variableEditIdx] = definition;
                setVariableEditIdx(null);
              });
            }}
            onCancel={() => setVariableEditIdx(null)}
          />
        </>
      )}
      {!currentEditingVariableDefinition && (
        <>
          <Stack direction="row" spacing={1} justifyContent="end">
            <Button
              onClick={() => {
                props.onCancel();
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={props.variableDefinitions === variableDefinitions}
              variant="contained"
              onClick={() => {
                props.onChange(variableDefinitions);
              }}
            >
              Apply Changes
            </Button>
          </Stack>
          <Typography variant="h3" mb={2}>
            Variable List
          </Typography>
          <Stack spacing={2}>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Visibility</TableCell>
                    <TableCell>Variable Name</TableCell>
                    <TableCell>Variable Type</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {variableDefinitions.map((v, idx) => (
                    <TableRow key={v.spec.name}>
                      <TableCell component="th" scope="row">
                        <Switch
                          checked={v.spec.display?.hidden !== true}
                          onChange={(e) => {
                            toggleVariableVisibility(idx, e.target.checked);
                          }}
                        />
                      </TableCell>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                        {v.spec.name}
                      </TableCell>
                      <TableCell>{v.kind}</TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => setVariableEditIdx(idx)}>
                          <PencilIcon />
                        </IconButton>
                        <IconButton onClick={() => removeVariable(idx)}>
                          <TrashIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box display="flex">
              <Button onClick={addVariable} variant="contained">
                Add New Variable
              </Button>
            </Box>
          </Stack>
        </>
      )}
    </Box>
  );
}

export function TemplateVariableList() {
  const [isEditing, setIsEditing] = useState(false);
  const variableDefinitions = useTemplateVariableDefinitions();
  const { isEditMode } = useEditMode();
  const [showVariablesInEditMode, setShowVariablesInEditMode] = useState(true);
  const showVariables = isEditMode ? showVariablesInEditMode : true;
  const { setVariableDefinitions } = useTemplateVariableActions();

  return (
    <Box m={2}>
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
      <Box display={'flex'} justifyContent="space-between">
        <Stack direction={'row'} spacing={2}>
          {showVariables &&
            variableDefinitions.map((v) => (
              <Box key={v.spec.name} display={v.spec.display?.hidden ? 'none' : undefined}>
                <TemplateVariable key={v.spec.name} name={v.spec.name} />
              </Box>
            ))}
        </Stack>
      </Box>
    </Box>
  );
}
