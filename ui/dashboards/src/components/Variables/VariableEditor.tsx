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

import { useState, useMemo } from 'react';
import {
  Button,
  Stack,
  Box,
  TableContainer,
  TableBody,
  TableRow,
  TableCell as MuiTableCell,
  Table,
  TableHead,
  Switch,
  Typography,
  IconButton,
  Alert,
  styled,
} from '@mui/material';
import { VariableDefinition } from '@perses-dev/core';
import { useImmer } from 'use-immer';
import PencilIcon from 'mdi-material-ui/Pencil';
import TrashIcon from 'mdi-material-ui/TrashCan';
import ArrowUp from 'mdi-material-ui/ArrowUp';
import ArrowDown from 'mdi-material-ui/ArrowDown';

import { VariableEditForm } from './VariableEditorForm';
import { VARIABLE_TYPES } from './variable-model';

function getVariableLabelByKind(kind: string) {
  return VARIABLE_TYPES.find((variableType) => variableType.kind === kind)?.label;
}

function getValidation(variableDefinitions: VariableDefinition[]) {
  const errors = [];

  /**  Variable names must be unique */
  const variableNames = variableDefinitions.map((variableDefinition) => variableDefinition.spec.name);
  const uniqueVariableNames = new Set(variableNames);
  if (variableNames.length !== uniqueVariableNames.size) {
    errors.push('Variable names must be unique');
  }
  return {
    errors: errors,
    isValid: errors.length === 0,
  };
}

export function VariableEditor(props: {
  variableDefinitions: VariableDefinition[];
  onChange: (variableDefinitions: VariableDefinition[]) => void;
  onCancel: () => void;
}) {
  const [variableDefinitions, setVariableDefinitions] = useImmer(props.variableDefinitions);
  const [variableEditIdx, setVariableEditIdx] = useState<number | null>(null);

  const validation = useMemo(() => getValidation(variableDefinitions), [variableDefinitions]);
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
    setVariableEditIdx(variableDefinitions.length);
  };

  const toggleVariableVisibility = (index: number, visible: boolean) => {
    setVariableDefinitions((draft) => {
      const v = draft[index];
      if (!v) {
        return;
      }
      if (!v.spec.display) {
        v.spec.display = {
          name: v.spec.name,
          hidden: false,
        };
      }
      v.spec.display.hidden = visible === false;
    });
  };

  const changeVariableOrder = (index: number, direction: 'up' | 'down') => {
    setVariableDefinitions((draft) => {
      if (direction === 'up') {
        const prevElement = draft[index - 1];
        const currentElement = draft[index];
        if (index === 0 || !prevElement || !currentElement) {
          return;
        }
        draft[index - 1] = currentElement;
        draft[index] = prevElement;
      } else {
        const nextElement = draft[index + 1];
        const currentElement = draft[index];
        if (index === draft.length - 1 || !nextElement || !currentElement) {
          return;
        }
        draft[index + 1] = currentElement;
        draft[index] = nextElement;
      }
    });
  };

  return (
    <>
      {currentEditingVariableDefinition && (
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
      )}
      {!currentEditingVariableDefinition && (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: (theme) => theme.spacing(1, 2),
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h2">Variables</Typography>
            <Stack direction="row" spacing={1} marginLeft="auto">
              <Button
                disabled={props.variableDefinitions === variableDefinitions || !validation.isValid}
                variant="contained"
                onClick={() => {
                  props.onChange(variableDefinitions);
                }}
              >
                Apply
              </Button>
              <Button
                color="secondary"
                variant="outlined"
                onClick={() => {
                  props.onCancel();
                }}
              >
                Cancel
              </Button>
            </Stack>
          </Box>
          <Box padding={2} sx={{ overflowY: 'scroll' }}>
            <Stack spacing={2}>
              {!validation.isValid &&
                validation.errors.map((error) => (
                  <Alert severity="error" key={error}>
                    {error}
                  </Alert>
                ))}
              <TableContainer>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Visibility</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
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
                        <TableCell>{getVariableLabelByKind(v.kind) ?? v.kind}</TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => changeVariableOrder(idx, 'up')} disabled={idx === 0}>
                            <ArrowUp />
                          </IconButton>
                          <IconButton
                            onClick={() => changeVariableOrder(idx, 'down')}
                            disabled={idx === variableDefinitions.length - 1}
                          >
                            <ArrowDown />
                          </IconButton>

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
                  Add New
                </Button>
              </Box>
            </Stack>
          </Box>
        </>
      )}
    </>
  );
}

const TableCell = styled(MuiTableCell)(({ theme }) => ({
  borderBottom: `solid 1px ${theme.palette.divider}`,
}));
