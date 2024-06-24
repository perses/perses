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

import {
  Box,
  Button,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AddIcon from 'mdi-material-ui/Plus';
import PencilIcon from 'mdi-material-ui/Pencil';
import TrashIcon from 'mdi-material-ui/TrashCan';
import { Action, DatasourceDefinition, DatasourceSpec } from '@perses-dev/core';
import { DatasourceEditorForm, ValidationProvider } from '@perses-dev/plugin-system';
import { useState } from 'react';
import { useImmer } from 'use-immer';
import { useDiscardChangesConfirmationDialog } from '../../context';

export function DatasourceEditor(props: {
  datasources: Record<string, DatasourceSpec>;
  onChange: (datasources: Record<string, DatasourceSpec>) => void;
  onCancel: () => void;
}) {
  const [datasources, setDatasources] = useImmer(props.datasources);
  const [datasourceFormAction, setDatasourceFormAction] = useState<Action>('update');
  const [datasourceEdit, setDatasourceEdit] = useState<DatasourceDefinition | null>(null);
  const defaultSpec: DatasourceSpec = {
    default: false,
    plugin: {
      // TODO: find a way to avoid assuming that the PrometheusDatasource plugin is installed
      kind: 'PrometheusDatasource',
      spec: {},
    },
  };

  const { openDiscardChangesConfirmationDialog, closeDiscardChangesConfirmationDialog } =
    useDiscardChangesConfirmationDialog();

  const handleCancel = () => {
    if (JSON.stringify(props.datasources) !== JSON.stringify(datasources)) {
      openDiscardChangesConfirmationDialog({
        onDiscardChanges: () => {
          closeDiscardChangesConfirmationDialog();
          props.onCancel();
        },
        onCancel: () => {
          closeDiscardChangesConfirmationDialog();
        },
        description:
          'You have unapplied changes. Are you sure you want to discard these changes? Changes cannot be recovered.',
      });
    } else {
      props.onCancel();
    }
  };

  const removeDatasource = (name: string) => {
    setDatasources((draft) => {
      delete draft[name];
    });
  };

  const addDatasource = () => {
    setDatasourceFormAction('create');
    setDatasourceEdit({
      name: 'NewDatasource',
      spec: defaultSpec,
    });
  };

  const editDatasource = (name: string) => {
    setDatasourceFormAction('update');
    setDatasourceEdit({
      name: name,
      spec: datasources[name] ?? defaultSpec,
    });
  };

  return (
    <>
      {datasourceEdit ? (
        <ValidationProvider>
          <DatasourceEditorForm
            initialDatasourceDefinition={datasourceEdit}
            initialAction={datasourceFormAction}
            isDraft={true}
            onSave={(def: DatasourceDefinition) => {
              setDatasources((draft) => {
                delete draft[datasourceEdit.name]; // to tackle the case where datasource name has been changed
                draft[def.name] = def.spec;
                setDatasourceEdit(null);
              });
            }}
            onClose={() => {
              setDatasourceEdit(null);
            }}
          />
        </ValidationProvider>
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: (theme) => theme.spacing(1, 2),
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h2">Edit Dashboard Datasources</Typography>
            <Stack direction="row" spacing={1} marginLeft="auto">
              <Button
                disabled={props.datasources === datasources}
                variant="contained"
                onClick={() => {
                  props.onChange(datasources);
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
                <TableContainer>
                  <Table sx={{ minWidth: 650 }} aria-label="table of datasources">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(datasources).map(([name, spec]) => {
                        return (
                          <TableRow key={name}>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                              {name}
                            </TableCell>
                            <TableCell>{spec.plugin.kind}</TableCell>
                            <TableCell>{spec.display?.description ?? ''}</TableCell>
                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                              <IconButton onClick={() => editDatasource(name)}>
                                <PencilIcon />
                              </IconButton>
                              <IconButton onClick={() => removeDatasource(name)}>
                                <TrashIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box display="flex">
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ marginLeft: 'auto' }}
                    onClick={addDatasource}
                  >
                    Add Datasource
                  </Button>
                </Box>
              </Stack>
            </Stack>
          </Box>
        </>
      )}
    </>
  );
}
