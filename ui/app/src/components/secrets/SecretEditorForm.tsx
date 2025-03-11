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

import { Secret, secretsEditorSchema, SecretsEditorSchemaType } from '@perses-dev/core';
import React, { ReactElement, SyntheticEvent, useEffect, useMemo, useState } from 'react';
import { getSubmitText, getTitleAction } from '@perses-dev/plugin-system';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Box,
  BoxProps,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DiscardChangesConfirmationDialog, FormActions } from '@perses-dev/components';
import TrashIcon from 'mdi-material-ui/TrashCan';
import PlusIcon from 'mdi-material-ui/Plus';
import { FormEditorProps } from '../form-drawers';

const basicAuthIndex = 'basicAuth';
const authorizationIndex = 'authorization';
const oauthIndex = 'oauth';

type SecretEditorFormProps = FormEditorProps<Secret>;

type EndpointParams = {
  [key: string]: string[];
};

export function SecretEditorForm({
  initialValue,
  action,
  isDraft,
  isReadonly,
  onActionChange,
  onSave,
  onClose,
  onDelete,
}: SecretEditorFormProps): ReactElement {
  // Reset all attributes that are "hidden" by the API and are returning <secret> as value
  const initialSecretClean: Secret = useMemo(() => {
    const result = { ...initialValue };
    if (result.spec.basicAuth?.password) result.spec.basicAuth.password = '';
    if (result.spec.authorization?.credentials) result.spec.authorization.credentials = '';
    if (result.spec.oauth?.clientID) result.spec.oauth.clientID = '';
    if (result.spec.oauth?.clientSecret) result.spec.oauth.clientSecret = '';
    if (result.spec.tlsConfig?.ca) result.spec.tlsConfig.ca = '';
    if (result.spec.tlsConfig?.cert) result.spec.tlsConfig.cert = '';
    if (result.spec.tlsConfig?.key) result.spec.tlsConfig.key = '';
    return result;
  }, [initialValue]);

  const [isDiscardDialogOpened, setDiscardDialogOpened] = useState<boolean>(false);

  const titleAction = getTitleAction(action, isDraft);
  const submitText = getSubmitText(action, isDraft);

  const form = useForm<SecretsEditorSchemaType>({
    resolver: zodResolver(secretsEditorSchema),
    mode: 'onBlur',
    defaultValues: initialSecretClean,
  });

  const [isTLSConfigEnabled, setTLSConfigEnabled] = useState<boolean>(initialSecretClean.spec.tlsConfig !== undefined);

  const processForm: SubmitHandler<SecretsEditorSchemaType> = (data: Secret) => {
    onSave(data);
  };

  // When user click on cancel, several possibilities:
  // - create action: ask for discard approval
  // - update action: ask for discard approval if changed
  // - read action: don´t ask for discard approval
  function handleCancel(): void {
    if (JSON.stringify(initialSecretClean) !== JSON.stringify(form.getValues())) {
      setDiscardDialogOpened(true);
    } else {
      onClose();
    }
  }

  // Form errors are removed only from latest input touched
  // This will remove errors for others inputs
  useEffect(() => {
    form.clearErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.formState.isValid]);

  const [tabValue, setTabValue] = useState<string>(
    initialSecretClean.spec.basicAuth
      ? basicAuthIndex
      : initialSecretClean.spec.authorization
        ? authorizationIndex
        : oauthIndex
  );

  const handleTabChange = (event: SyntheticEvent, newValue: string): void => {
    if (newValue === basicAuthIndex) {
      form.setValue('spec.basicAuth', { username: '', password: '', passwordFile: '' });
    } else if (newValue === authorizationIndex) {
      form.setValue('spec.authorization', { type: '', credentials: '', credentialsFile: '' });
    } else if (newValue === oauthIndex) {
      form.setValue('spec.oauth', {
        clientID: '',
        clientSecret: '',
        clientSecretFile: '',
        tokenURL: '',
        scopes: [],
        endpointParams: new Map<string, string[]>(),
        authStyle: 0,
      });
    }
    form.trigger();

    setTabValue(newValue);

    if (newValue !== basicAuthIndex) {
      form.setValue('spec.basicAuth', undefined);
    }
    if (newValue !== authorizationIndex) {
      form.setValue('spec.authorization', undefined);
    }
    if (newValue !== oauthIndex) {
      form.setValue('spec.oauth', undefined);
    }
    form.trigger();
  };

  return (
    <FormProvider {...form}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: (theme) => theme.spacing(1, 2),
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h2">{titleAction} Secret</Typography>
        <FormActions
          action={action}
          submitText={submitText}
          isReadonly={isReadonly}
          isValid={form.formState.isValid}
          onActionChange={onActionChange}
          onSubmit={form.handleSubmit(processForm)}
          onDelete={onDelete}
          onCancel={handleCancel}
        />
      </Box>
      <Stack padding={2} gap={2} sx={{ overflowY: 'scroll' }}>
        <Stack gap={2} direction="row">
          <Controller
            control={form.control}
            name="metadata.name"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                required
                fullWidth
                label="Name"
                InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                InputProps={{
                  disabled: action === 'update',
                  readOnly: action === 'read',
                }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                onChange={(event) => {
                  field.onChange(event);
                }}
              />
            )}
          />
        </Stack>
        <Divider />

        <Box sx={{ width: '100%' }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <FormControl>
              <RadioGroup row value={tabValue} onChange={handleTabChange} aria-labelledby="Secret Authorization Setup">
                <FormControlLabel
                  disabled={isReadonly}
                  value={basicAuthIndex}
                  control={<Radio />}
                  label="Basic Authorization"
                />
                <FormControlLabel
                  disabled={isReadonly}
                  value={authorizationIndex}
                  control={<Radio />}
                  label="Custom Authorization"
                />
                <FormControlLabel disabled={isReadonly} value={oauthIndex} control={<Radio />} label="OAuth" />
              </RadioGroup>
            </FormControl>
          </Stack>
          <TabPanel value={tabValue} index={basicAuthIndex}>
            <Stack gap={2}>
              <Controller
                name="spec.basicAuth.username"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    required
                    fullWidth
                    label="Username"
                    InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                    InputProps={{
                      readOnly: action === 'read',
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    onChange={(event) => {
                      field.onChange(event);
                    }}
                  />
                )}
              />
              <Stack direction="row">
                <Controller
                  control={form.control}
                  name="spec.basicAuth.password"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Password"
                      type="password"
                      InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                      InputProps={{
                        readOnly: action === 'read',
                      }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(event) => {
                        field.onChange(event);
                      }}
                    />
                  )}
                />
                <Divider orientation="vertical">OR</Divider>
                <Controller
                  control={form.control}
                  name="spec.basicAuth.passwordFile"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Password File"
                      InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                      InputProps={{
                        readOnly: action === 'read',
                      }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(event) => {
                        field.onChange(event);
                      }}
                    />
                  )}
                />
              </Stack>
            </Stack>
          </TabPanel>
          <TabPanel value={tabValue} index={authorizationIndex}>
            <Stack gap={2}>
              <Controller
                control={form.control}
                name="spec.authorization.type"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Type"
                    InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                    InputProps={{
                      readOnly: action === 'read',
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    onChange={(event) => {
                      field.onChange(event);
                    }}
                  />
                )}
              />
              <Stack direction="row">
                <Controller
                  control={form.control}
                  name="spec.authorization.credentials"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Credentials"
                      type="password"
                      InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                      InputProps={{
                        readOnly: action === 'read',
                      }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(event) => {
                        field.onChange(event);
                      }}
                    />
                  )}
                />
                <Divider orientation="vertical">OR</Divider>
                <Controller
                  control={form.control}
                  name="spec.authorization.credentialsFile"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Credentials File"
                      InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                      InputProps={{
                        readOnly: action === 'read',
                      }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(event) => {
                        field.onChange(event);
                      }}
                    />
                  )}
                />
              </Stack>
            </Stack>
          </TabPanel>
          <TabPanel value={tabValue} index={oauthIndex}>
            <Stack gap={2}>
              <Controller
                control={form.control}
                name="spec.oauth.clientID"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    required
                    fullWidth
                    label="Client ID"
                    type="password"
                    InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                    InputProps={{
                      readOnly: action === 'read',
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    onChange={(event) => {
                      field.onChange(event);
                    }}
                  />
                )}
              />
              <Stack direction="row">
                <Controller
                  control={form.control}
                  name="spec.oauth.clientSecret"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Client Secret"
                      type="password"
                      InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                      InputProps={{
                        readOnly: action === 'read',
                      }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(event) => {
                        field.onChange(event);
                      }}
                    />
                  )}
                />
                <Divider orientation="vertical">OR</Divider>
                <Controller
                  control={form.control}
                  name="spec.oauth.clientSecretFile"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Client Secret File"
                      InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                      InputProps={{
                        readOnly: action === 'read',
                      }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(event) => {
                        field.onChange(event);
                      }}
                    />
                  )}
                />
              </Stack>
              <Stack direction="row">
                <Controller
                  control={form.control}
                  name="spec.oauth.tokenURL"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      required
                      fullWidth
                      label="Token URL"
                      InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                      InputProps={{
                        readOnly: action === 'read',
                      }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(event) => {
                        field.onChange(event);
                      }}
                    />
                  )}
                />
              </Stack>
              <Stack gap={2}>
                <Typography variant="subtitle1">Scopes</Typography>
                <Controller
                  control={form.control}
                  name="spec.oauth.scopes"
                  render={({ field }) => {
                    const scopes = field.value || [];

                    const addScope = (): void => {
                      field.onChange([...scopes, '']);
                    };

                    const removeScope = (index: number): void => {
                      const newScopes = scopes.filter((_, i) => i !== index);
                      field.onChange(newScopes);
                    };

                    const updateScope = (index: number, value: string): void => {
                      const newScopes = [...scopes];
                      newScopes[index] = value;
                      field.onChange(newScopes);
                    };

                    return (
                      <Stack gap={2}>
                        {scopes.map((scope, index) => (
                          <Stack key={index} direction="row" gap={1} alignItems="center">
                            <TextField
                              fullWidth
                              value={scope}
                              placeholder="Enter scope"
                              InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                              InputProps={{
                                readOnly: action === 'read',
                              }}
                              onChange={(e) => updateScope(index, e.target.value)}
                            />
                            {!isReadonly && (
                              <IconButton onClick={() => removeScope(index)} size="small" sx={{ ml: 1 }}>
                                <TrashIcon />
                              </IconButton>
                            )}
                          </Stack>
                        ))}
                        {!isReadonly && (
                          <Button
                            startIcon={<PlusIcon />}
                            onClick={addScope}
                            variant="outlined"
                            sx={{ width: 'fit-content' }}
                          >
                            Add Scope
                          </Button>
                        )}
                      </Stack>
                    );
                  }}
                />
              </Stack>
              <Stack gap={2}>
                <Typography variant="subtitle1">Endpoint Params</Typography>
                <Controller
                  control={form.control}
                  name="spec.oauth.endpointParams"
                  render={({ field }) => {
                    const mapToEndpointParams = (
                      map: Map<string, string[]> | EndpointParams | undefined
                    ): EndpointParams => {
                      if (map instanceof Map) {
                        return Object.fromEntries(map);
                      }
                      return map || {};
                    };

                    const params: EndpointParams = mapToEndpointParams(field.value);

                    const addParam = (): void => {
                      const newParams: EndpointParams = {
                        ...params,
                        '': [''],
                      };
                      field.onChange(newParams);
                    };

                    const removeParam = (keyToRemove: string): void => {
                      const newParams: EndpointParams = Object.entries(params)
                        .filter(([key]) => key !== keyToRemove)
                        .reduce(
                          (acc, [key, value]) => ({
                            ...acc,
                            [key]: value,
                          }),
                          {}
                        );
                      field.onChange(newParams);
                    };

                    const updateParamKey = (oldKey: string, newKey: string): void => {
                      const newParams: EndpointParams = Object.entries(params).reduce(
                        (acc, [key, val]) => ({
                          ...acc,
                          [key === oldKey ? newKey : key]: val,
                        }),
                        {}
                      );
                      field.onChange(newParams);
                    };

                    const updateParamValue = (key: string, values: string[]): void => {
                      const newParams: EndpointParams = {
                        ...params,
                        [key]: values,
                      };
                      field.onChange(newParams);
                    };

                    const addValueToParam = (key: string): void => {
                      const currentValues = params[key] || [];
                      updateParamValue(key, [...currentValues, '']);
                    };

                    const removeValueFromParam = (key: string, indexToRemove: number): void => {
                      const currentValues = params[key] || [];
                      updateParamValue(
                        key,
                        currentValues.filter((_, index) => index !== indexToRemove)
                      );
                    };

                    const updateValue = (key: string, valueIndex: number, newValue: string): void => {
                      const currentValues = [...(params[key] || [])];
                      currentValues[valueIndex] = newValue;
                      updateParamValue(key, currentValues);
                    };

                    return (
                      <Stack gap={2}>
                        {Object.entries(params).map(([key, values], paramIndex) => (
                          <Stack key={paramIndex} gap={1}>
                            <Stack direction="row" gap={1} alignItems="center">
                              <TextField
                                value={key}
                                placeholder="Parameter name"
                                InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                                InputProps={{
                                  readOnly: action === 'read',
                                }}
                                onChange={(e) => updateParamKey(key, e.target.value)}
                              />
                              {!isReadonly && (
                                <IconButton onClick={() => removeParam(key)} size="small">
                                  <TrashIcon />
                                </IconButton>
                              )}
                            </Stack>
                            <Stack gap={1} sx={{ pl: 3 }}>
                              {values.map((value, valueIndex) => (
                                <Stack key={valueIndex} direction="row" gap={1} alignItems="center">
                                  <TextField
                                    fullWidth
                                    value={value}
                                    placeholder="Parameter value"
                                    InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                                    InputProps={{
                                      readOnly: action === 'read',
                                    }}
                                    onChange={(e) => updateValue(key, valueIndex, e.target.value)}
                                  />
                                  {!isReadonly && values.length > 1 && (
                                    <IconButton onClick={() => removeValueFromParam(key, valueIndex)} size="small">
                                      <TrashIcon />
                                    </IconButton>
                                  )}
                                </Stack>
                              ))}
                              {!isReadonly && (
                                <Button
                                  startIcon={<PlusIcon />}
                                  onClick={() => addValueToParam(key)}
                                  variant="outlined"
                                  sx={{ width: 'fit-content' }}
                                >
                                  Add Value
                                </Button>
                              )}
                            </Stack>
                          </Stack>
                        ))}
                        {!isReadonly && (
                          <Button
                            startIcon={<PlusIcon />}
                            onClick={addParam}
                            variant="outlined"
                            sx={{ width: 'fit-content' }}
                          >
                            Add Parameter
                          </Button>
                        )}
                      </Stack>
                    );
                  }}
                />
              </Stack>
              <Stack direction="row">
                <Controller
                  control={form.control}
                  name="spec.oauth.authStyle"
                  render={({ field, fieldState }) => (
                    <Tooltip
                      title={
                        field.value === 0
                          ? 'Automatically detect the best auth style to use based on the provider'
                          : field.value === 1
                            ? 'Send OAuth credentials as URL parameters'
                            : field.value === 2
                              ? 'Send OAuth credentials using HTTP Basic Authorization'
                              : ''
                      }
                      placement="right"
                    >
                      <FormControl fullWidth error={!!fieldState.error}>
                        <InputLabel id="auth-style-label" shrink={action === 'read' ? true : undefined}>
                          Auth Style
                        </InputLabel>
                        <Select
                          {...field}
                          labelId="auth-style-label"
                          label="Auth Style"
                          readOnly={action === 'read'}
                          value={field.value ?? 0}
                          onChange={(event) => {
                            field.onChange(event.target.value === '' ? undefined : +event.target.value);
                          }}
                        >
                          <MenuItem value={0}>Auto Detect</MenuItem>
                          <MenuItem value={1}>In Params</MenuItem>
                          <MenuItem value={2}>In Header</MenuItem>
                        </Select>
                        {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
                      </FormControl>
                    </Tooltip>
                  )}
                />
              </Stack>
            </Stack>
          </TabPanel>
        </Box>
        <Stack gap={1}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="h1">TLS Config</Typography>
            {isTLSConfigEnabled && (
              <IconButton
                sx={{ width: 'fit-content', height: 'fit-content' }}
                onClick={() => {
                  setTLSConfigEnabled(false);
                  form.setValue('spec.tlsConfig', undefined);
                  form.trigger();
                }}
              >
                <TrashIcon />
              </IconButton>
            )}
          </Stack>
          {isTLSConfigEnabled ? (
            <Stack gap={2}>
              <Stack direction="row">
                <Controller
                  control={form.control}
                  name="spec.tlsConfig.ca"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="CA"
                      type="password"
                      InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                      InputProps={{
                        readOnly: action === 'read',
                      }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(event) => {
                        field.onChange(event);
                      }}
                    />
                  )}
                />
                <Divider orientation="vertical">OR</Divider>
                <Controller
                  control={form.control}
                  name="spec.tlsConfig.caFile"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="CA File"
                      InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                      InputProps={{
                        readOnly: action === 'read',
                      }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(event) => {
                        field.onChange(event);
                      }}
                    />
                  )}
                />
              </Stack>
              <Stack direction="row">
                <Controller
                  control={form.control}
                  name="spec.tlsConfig.cert"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Cert"
                      type="password"
                      InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                      InputProps={{
                        readOnly: action === 'read',
                      }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(event) => {
                        field.onChange(event);
                      }}
                    />
                  )}
                />
                <Divider orientation="vertical">OR</Divider>
                <Controller
                  control={form.control}
                  name="spec.tlsConfig.certFile"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Cert File"
                      InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                      InputProps={{
                        readOnly: action === 'read',
                      }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(event) => {
                        field.onChange(event);
                      }}
                    />
                  )}
                />
              </Stack>
              <Stack direction="row">
                <Controller
                  control={form.control}
                  name="spec.tlsConfig.key"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Key"
                      type="password"
                      InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                      InputProps={{
                        readOnly: action === 'read',
                      }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(event) => {
                        field.onChange(event);
                      }}
                    />
                  )}
                />
                <Divider orientation="vertical">OR</Divider>
                <Controller
                  control={form.control}
                  name="spec.tlsConfig.keyFile"
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Key File"
                      InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                      InputProps={{
                        readOnly: action === 'read',
                      }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      onChange={(event) => {
                        field.onChange(event);
                      }}
                    />
                  )}
                />
              </Stack>
              <Controller
                control={form.control}
                name="spec.tlsConfig.serverName"
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Server Name"
                    InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                    InputProps={{
                      readOnly: action === 'read',
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    onChange={(event) => {
                      field.onChange(event);
                    }}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="spec.tlsConfig.insecureSkipVerify"
                render={({ field }) => (
                  <FormControlLabel
                    label="Insecure Skip Verify"
                    control={
                      <Switch
                        {...field}
                        checked={!!field.value}
                        readOnly={action === 'read'}
                        onChange={(event) => {
                          if (action === 'read') return; // ReadOnly prop is not blocking user interaction...
                          field.onChange(event);
                        }}
                      />
                    }
                  />
                )}
              />
            </Stack>
          ) : (
            <IconButton
              sx={{ width: 'fit-content', height: 'fit-content' }}
              onClick={() => {
                form.setValue('spec.tlsConfig', {
                  ca: '',
                  caFile: '',
                  cert: '',
                  certFile: '',
                  key: '',
                  keyFile: '',
                  serverName: '',
                  insecureSkipVerify: false,
                });
                setTLSConfigEnabled(true);
              }}
            >
              <PlusIcon />
            </IconButton>
          )}
        </Stack>
      </Stack>

      <DiscardChangesConfirmationDialog
        description="Are you sure you want to discard these changes? Changes cannot be recovered."
        isOpen={isDiscardDialogOpened}
        onCancel={() => {
          setDiscardDialogOpened(false);
        }}
        onDiscardChanges={() => {
          setDiscardDialogOpened(false);
          onClose();
        }}
      />
    </FormProvider>
  );
}

interface TabPanelProps extends BoxProps {
  index: string;
  value: string;
}

function TabPanel({ children, value, index, ...props }: TabPanelProps): ReactElement {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`secret-form-tabpanel-${index}`}
      aria-labelledby={`secret-form-tab-${index}`}
      {...props}
    >
      {value === index && children}
    </Box>
  );
}
