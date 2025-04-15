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

import { useState, useMemo, ReactElement } from 'react';
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
  capitalize,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import AddIcon from 'mdi-material-ui/Plus';
import { Action, BuiltinVariableDefinition, VariableDefinition } from '@perses-dev/core';
import { useImmer } from 'use-immer';
import PencilIcon from 'mdi-material-ui/Pencil';
import TrashIcon from 'mdi-material-ui/TrashCan';
import ArrowUp from 'mdi-material-ui/ArrowUp';
import ArrowDown from 'mdi-material-ui/ArrowDown';
import ContentDuplicate from 'mdi-material-ui/ContentDuplicate';
import OpenInNewIcon from 'mdi-material-ui/OpenInNew';
import ExpandMoreIcon from 'mdi-material-ui/ChevronUp';

import { ValidationProvider, VariableEditorForm, VariableState, VARIABLE_TYPES } from '@perses-dev/plugin-system';
import { InfoTooltip } from '@perses-dev/components';
import { ExternalVariableDefinition, useDiscardChangesConfirmationDialog } from '../../context';
import { hydrateVariableDefinitionStates } from '../../context/VariableProvider/hydrationUtils';
import { BuiltinVariableAccordions } from './BuiltinVariableAccordions';

function getVariableLabelByKind(kind: string): 'List' | 'Text' | undefined {
  return VARIABLE_TYPES.find((variableType) => variableType.kind === kind)?.label;
}

function getValidation(variableDefinitions: VariableDefinition[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

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
  externalVariableDefinitions: ExternalVariableDefinition[];
  builtinVariableDefinitions: BuiltinVariableDefinition[];
  onChange: (variableDefinitions: VariableDefinition[]) => void;
  onCancel: () => void;
}): ReactElement {
  const [variableDefinitions, setVariableDefinitions] = useImmer(props.variableDefinitions);
  const [variableEditIdx, setVariableEditIdx] = useState<number | null>(null);
  const [variableFormAction, setVariableFormAction] = useState<Action>('update');

  const externalVariableDefinitions = props.externalVariableDefinitions;
  const builtinVariableDefinitions = props.builtinVariableDefinitions;
  const validation = useMemo(() => getValidation(variableDefinitions), [variableDefinitions]);
  const [variableState] = useMemo(() => {
    return [hydrateVariableDefinitionStates(variableDefinitions, {}, externalVariableDefinitions)];
  }, [externalVariableDefinitions, variableDefinitions]);
  const currentEditingVariableDefinition = typeof variableEditIdx === 'number' && variableDefinitions[variableEditIdx];

  const { openDiscardChangesConfirmationDialog, closeDiscardChangesConfirmationDialog } =
    useDiscardChangesConfirmationDialog();
  const handleCancel = (): void => {
    if (JSON.stringify(props.variableDefinitions) !== JSON.stringify(variableDefinitions)) {
      openDiscardChangesConfirmationDialog({
        onDiscardChanges: () => {
          closeDiscardChangesConfirmationDialog();
          props.onCancel();
        },
        onCancel: () => {
          closeDiscardChangesConfirmationDialog();
        },
        description:
          'You have unsaved changes in this panel. Are you sure you want to discard them? This action can’t be undone.',
      });
    } else {
      props.onCancel();
    }
  };

  const removeVariable = (index: number): void => {
    setVariableDefinitions((draft) => {
      draft.splice(index, 1);
    });
  };

  const addVariable = (): void => {
    setVariableFormAction('create');
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

  const editVariable = (index: number): void => {
    setVariableFormAction('update');
    setVariableEditIdx(index);
  };

  const toggleVariableVisibility = (index: number, visible: boolean): void => {
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

  const changeVariableOrder = (index: number, direction: 'up' | 'down'): void => {
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

  const overrideVariable = (v: VariableDefinition): void => {
    setVariableDefinitions((draft) => {
      draft.push(v);
    });
  };

  return (
    <>
      {currentEditingVariableDefinition && (
        <ValidationProvider>
          <VariableEditorForm
            initialVariableDefinition={currentEditingVariableDefinition}
            action={variableFormAction}
            isDraft={true}
            onActionChange={setVariableFormAction}
            onSave={(definition: VariableDefinition) => {
              setVariableDefinitions((draft) => {
                draft[variableEditIdx] = definition;
                setVariableEditIdx(null);
              });
            }}
            onClose={() => {
              if (variableFormAction === 'create') {
                removeVariable(variableEditIdx);
              }
              setVariableEditIdx(null);
            }}
          />
        </ValidationProvider>
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
            <Typography variant="h2">Edit Dashboard Variables</Typography>
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
              <Button color="secondary" variant="outlined" onClick={handleCancel}>
                Cancel
              </Button>
            </Stack>
          </Box>
          <Box padding={2} sx={{ overflowY: 'scroll' }}>
            <Stack spacing={2}>
              <Stack spacing={2}>
                {!validation.isValid &&
                  validation.errors.map((error) => (
                    <Alert severity="error" key={error}>
                      {error}
                    </Alert>
                  ))}
                <TableContainer>
                  <Table sx={{ minWidth: 650 }} aria-label="table of variables">
                    <TableHead>
                      <TableRow>
                        <TableCell>Visibility</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Actions</TableCell>
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
                            <VariableName name={v.spec.name} state={variableState.get({ name: v.spec.name })} />
                          </TableCell>
                          <TableCell>{getVariableLabelByKind(v.kind) ?? v.kind}</TableCell>
                          <TableCell>{v.spec.display?.description ?? ''}</TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            <IconButton onClick={() => changeVariableOrder(idx, 'up')} disabled={idx === 0}>
                              <ArrowUp />
                            </IconButton>
                            <IconButton
                              onClick={() => changeVariableOrder(idx, 'down')}
                              disabled={idx === variableDefinitions.length - 1}
                            >
                              <ArrowDown />
                            </IconButton>
                            <IconButton onClick={() => editVariable(idx)}>
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
                  <Button variant="contained" startIcon={<AddIcon />} sx={{ marginLeft: 'auto' }} onClick={addVariable}>
                    Add Variable
                  </Button>
                </Box>
              </Stack>
              {externalVariableDefinitions &&
                !externalVariableDefinitions.every((v) => v.definitions.length === 0) &&
                externalVariableDefinitions.map(
                  (extVar, key) =>
                    extVar.definitions.length > 0 && (
                      <Accordion
                        key={key}
                        sx={(theme) => ({
                          '.MuiAccordionSummary-root': {
                            backgroundColor: theme.palette.background.lighter,
                          },
                          '.MuiAccordionDetails-root': {
                            backgroundColor: theme.palette.background.lighter,
                          },
                        })}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          aria-controls={extVar.source}
                          id={extVar.source}
                        >
                          <Stack flexDirection="row" alignItems="center" justifyContent="start">
                            <>
                              {extVar.tooltip ? (
                                <Typography variant="h2">
                                  <InfoTooltip
                                    title={extVar.tooltip.title || ''}
                                    description={extVar.tooltip.description || ''}
                                  >
                                    <span>{capitalize(extVar.source)} Variables</span>
                                  </InfoTooltip>
                                </Typography>
                              ) : (
                                <Typography variant="h2">{capitalize(extVar.source)} Variables</Typography>
                              )}
                              {extVar.editLink && (
                                <IconButton href={extVar.editLink} target="_blank">
                                  <OpenInNewIcon fontSize="small" />
                                </IconButton>
                              )}
                            </>
                          </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                          <TableContainer>
                            <Table sx={{ minWidth: 650 }} aria-label="table of external variables">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Visibility</TableCell>
                                  <TableCell>Name</TableCell>
                                  <TableCell>Type</TableCell>
                                  <TableCell>Description</TableCell>
                                  <TableCell align="right">Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {extVar.definitions.map((v) => (
                                  <TableRow key={v.spec.name}>
                                    <TableCell component="th" scope="row">
                                      <Switch checked={v.spec.display?.hidden !== true} disabled />
                                    </TableCell>

                                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                                      <VariableName
                                        name={v.spec.name}
                                        state={variableState.get({ name: v.spec.name, source: extVar.source })}
                                      />
                                    </TableCell>
                                    <TableCell>{getVariableLabelByKind(v.kind) ?? v.kind}</TableCell>
                                    <TableCell>{v.spec.display?.description ?? ''}</TableCell>
                                    <TableCell align="right">
                                      <Tooltip title="Override">
                                        <IconButton
                                          onClick={() => overrideVariable(v)}
                                          disabled={!!variableState.get({ name: v.spec.name })}
                                        >
                                          <ContentDuplicate />
                                        </IconButton>
                                      </Tooltip>
                                      <IconButton disabled>
                                        <ArrowUp />
                                      </IconButton>
                                      <IconButton disabled>
                                        <ArrowDown />
                                      </IconButton>
                                      <IconButton disabled>
                                        <PencilIcon />
                                      </IconButton>
                                      <IconButton disabled>
                                        <TrashIcon />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </AccordionDetails>
                      </Accordion>
                    )
                )}
              {builtinVariableDefinitions && (
                <BuiltinVariableAccordions builtinVariableDefinitions={builtinVariableDefinitions} />
              )}
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

export function VariableName(props: { name: string; state: VariableState | undefined }): ReactElement {
  const { name, state } = props;
  return (
    <>
      {!state?.overridden && `${name} `}
      {!state?.overridden && state?.overriding && (
        <Box fontWeight="normal" color={(theme) => theme.palette.primary.main}>
          (overriding)
        </Box>
      )}
      {state?.overridden && (
        <>
          <Box color={(theme) => theme.palette.grey[500]}>{name}</Box>
          <Box fontWeight="normal" color={(theme) => theme.palette.grey[500]}>
            (overridden)
          </Box>
        </>
      )}
    </>
  );
}
