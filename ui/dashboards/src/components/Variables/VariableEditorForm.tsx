import {
  Box,
  Typography,
  Switch,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
  Stack,
  Tooltip,
} from '@mui/material';
import { useImmer } from 'use-immer';
import { useListPluginMetadata, PluginSpecEditor, usePluginRegistry } from '@perses-dev/plugin-system';
import { VariableDefinition, TextVariableDefinition, ListVariableDefinition } from '@perses-dev/core';
import React from 'react';

const VARIABLE_TYPES = ['ListVariable', 'TextVariable'] as const;

function getInitialState(initialVariableDefinition: VariableDefinition) {
  const textVariableFields = {
    value: (initialVariableDefinition as TextVariableDefinition).spec.value ?? '',
  };

  const listVariableFields = {
    allowMultiple: false,
    allowAll: false,
    plugin: {
      kind: '',
      spec: {},
    },
  };
  if (initialVariableDefinition.kind === 'ListVariable') {
    listVariableFields.allowMultiple = initialVariableDefinition.spec.allow_all_value ?? false;
    listVariableFields.allowAll = initialVariableDefinition.spec.allow_all_value ?? false;
    listVariableFields.plugin = initialVariableDefinition.spec.plugin;
  }

  return {
    name: initialVariableDefinition.spec.name,
    label: initialVariableDefinition.spec.display?.label,
    kind: initialVariableDefinition.kind,
    description: '',
    listVariableFields,
    textVariableFields,
  };
}

type VariableEditorState = ReturnType<typeof getInitialState>;

function getVariableDefinitionFromState(state: VariableEditorState): VariableDefinition {
  const { name, label, kind } = state;

  const commonSpec = {
    name,
    display: {
      label,
    },
  };

  if (kind === 'TextVariable') {
    return {
      kind,
      spec: {
        ...commonSpec,
        ...state.textVariableFields,
      },
    } as TextVariableDefinition;
  }

  if (kind === 'ListVariable') {
    return {
      kind,
      spec: {
        ...commonSpec,
        allow_multiple: state.listVariableFields.allowMultiple,
        allow_all_value: state.listVariableFields.allowAll,
        plugin: state.listVariableFields.plugin,
      },
    } as ListVariableDefinition;
  }
  throw new Error(`Unknown variable kind: ${kind}`);
}

const SectionHeader = ({ children }: React.PropsWithChildren) => (
  <Typography pb={2} variant="subtitle1">
    {children}
  </Typography>
);

export function VariableEditForm({
  initialVariableDefinition,
  onChange,
  onCancel,
}: {
  initialVariableDefinition: VariableDefinition;
  onChange: (def: VariableDefinition) => void;
  onCancel: () => void;
}) {
  const { data: pluginList } = useListPluginMetadata('Variable');
  const { getPlugin } = usePluginRegistry();
  const [state, setState] = useImmer(getInitialState(initialVariableDefinition));

  const updatePluginKind = async (kind: string) => {
    const p = await getPlugin('Variable', kind);
    setState((draft) => {
      draft.listVariableFields.plugin.kind = kind;
      draft.listVariableFields.plugin.spec = p.createInitialOptions();
    });
  };

  return (
    <Box>
      <SectionHeader>General</SectionHeader>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={6}>
          <TextField
            label="Name"
            value={state.name}
            onChange={(v) => {
              setState((draft) => {
                draft.name = v.target.value as string;
              });
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel id="variable-type-select-label">Type</InputLabel>
            <Select
              labelId="variable-type-select-label"
              id="variable-type-select"
              label="Type"
              value={state.kind}
              onChange={(v) => {
                setState((draft) => {
                  draft.kind = v.target.value as VariableEditorState['kind'];
                });
              }}
            >
              {VARIABLE_TYPES.map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Label"
            value={state.label}
            onChange={(v) => {
              setState((draft) => {
                draft.label = v.target.value;
              });
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Description"
            value={state.description}
            onChange={(v) => {
              setState((draft) => {
                draft.description = v.target.value;
              });
            }}
          />
        </Grid>
      </Grid>

      {state.kind === 'TextVariable' && (
        <>
          <SectionHeader>Text Options</SectionHeader>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12}>
              <TextField
                label="Value"
                value={state.textVariableFields.value}
                onChange={(v) => {
                  setState((draft) => {
                    draft.textVariableFields.value = v.target.value;
                  });
                }}
              />
            </Grid>
          </Grid>
        </>
      )}

      {state.kind === 'ListVariable' && (
        <>
          <SectionHeader>List Options</SectionHeader>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel id="variable-source-select-label">Source</InputLabel>
                <Select
                  label="Source"
                  labelId="variable-type-select-label"
                  id="variable-source-select"
                  value={state.listVariableFields.plugin.kind}
                  onChange={(v) => updatePluginKind(v.target.value as string)}
                >
                  {pluginList?.map((v) => (
                    <MenuItem key={v.kind} value={v.kind}>
                      {v.kind}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              {state.listVariableFields.plugin.kind && (
                <>
                  <Box mb={2}>Query</Box>
                  <Box display="flex">
                    <Box flexGrow={1}>
                      <PluginSpecEditor
                        pluginKind={state.listVariableFields.plugin.kind}
                        pluginType="Variable"
                        value={state.listVariableFields.plugin.spec}
                        onChange={(val) => {
                          setState((draft) => {
                            draft.listVariableFields.plugin.spec = val;
                          });
                        }}
                      />
                    </Box>
                    <Tooltip title="Coming Soon!" placement="top">
                      <span>
                        <Button disabled>Test Query</Button>
                      </span>
                    </Tooltip>
                  </Box>
                </>
              )}
            </Grid>
          </Grid>

          <SectionHeader>Dropdown Options</SectionHeader>
          <Grid container spacing={1} mb={1}>
            <Grid item xs={12}>
              Allow Multiple
              <Switch
                checked={state.listVariableFields.allowMultiple}
                onChange={(e) => {
                  setState((draft) => {
                    draft.listVariableFields.allowMultiple = e.target.checked;
                  });
                }}
              />
            </Grid>
            <Grid item xs={12}>
              Allow All
              <Switch
                checked={state.listVariableFields.allowAll}
                onChange={(e) => {
                  setState((draft) => {
                    draft.listVariableFields.allowAll = e.target.checked;
                  });
                }}
              />
            </Grid>
          </Grid>
        </>
      )}

      <Stack direction={'row'} spacing={2} justifyContent="end">
        <Button
          onClick={() => {
            onCancel();
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={() => {
            onChange(getVariableDefinitionFromState(state));
          }}
        >
          Update Variable
        </Button>
      </Stack>
    </Box>
  );
}
