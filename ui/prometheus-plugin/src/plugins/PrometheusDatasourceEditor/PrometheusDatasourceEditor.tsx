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

import { DurationString, RequestHeaders } from '@perses-dev/core';
import { OptionsEditorRadios } from '@perses-dev/plugin-system';
import { Grid, IconButton, TextField, Typography } from '@mui/material';
import React, { Fragment, useState } from 'react';
import MinusIcon from 'mdi-material-ui/Minus';
import PlusIcon from 'mdi-material-ui/Plus';
import { DEFAULT_SCRAPE_INTERVAL, PrometheusDatasourceSpec } from './types';

export interface PrometheusDatasourceEditorProps {
  value: PrometheusDatasourceSpec;
  onChange: (next: PrometheusDatasourceSpec) => void;
  isReadonly?: boolean;
}

export function PrometheusDatasourceEditor(props: PrometheusDatasourceEditorProps) {
  const { value, onChange, isReadonly } = props;
  const strDirect = 'Direct access';
  const strProxy = 'Proxy';

  // TODO refactor with useImmer to avoid doing so much destructuring? feasibility & performances to be checked

  // utilitary function used for headers when renaming a property
  // -> TODO it would be cleaner to manipulate headers as a list instead, to avoid doing this.
  //    This could be a pure frontend trick, but change in the backend datamodel should also be considered
  const buildNewHeaders = (oldHeaders: RequestHeaders | undefined, oldName: string, newName: string) => {
    if (oldHeaders === undefined) return oldHeaders;
    const keys = Object.keys(oldHeaders);
    const newHeaders = keys.reduce<Record<string, string>>((acc, val) => {
      if (val === oldName) {
        acc[newName] = oldHeaders[oldName] || '';
      } else {
        acc[val] = oldHeaders[val] || '';
      }
      return acc;
    }, {});

    return { ...newHeaders };
  };

  const tabs = [
    {
      label: strDirect,
      content: (
        <>
          <TextField
            fullWidth
            label="URL"
            value={value.directUrl || ''}
            InputProps={{
              readOnly: isReadonly,
            }}
            InputLabelProps={{ shrink: isReadonly ? true : undefined }}
            onChange={(e) => onChange({ ...value, directUrl: e.target.value })}
          />
        </>
      ),
    },
    {
      label: strProxy,
      content: (
        <>
          <TextField
            fullWidth
            label="URL"
            value={value.proxy?.spec.url || ''}
            InputProps={{
              readOnly: isReadonly,
            }}
            InputLabelProps={{ shrink: isReadonly ? true : undefined }}
            onChange={(e) =>
              onChange({
                ...value,
                ...(value.proxy && {
                  proxy: {
                    ...value.proxy,
                    spec: {
                      ...value.proxy.spec,
                      url: e.target.value,
                    },
                  },
                }),
              })
            }
          />
          <Typography variant="h4" mt={2} mb={1}>
            Allowed endpoints
          </Typography>
          <Grid container spacing={2} mb={2}>
            {value.proxy?.spec.allowedEndpoints ? (
              value.proxy.spec.allowedEndpoints.map(({ endpointPattern, method }, i) => {
                return (
                  <Fragment key={i}>
                    <Grid item xs={8}>
                      <TextField
                        disabled // at the moment the allowed endpoints cannot be modified (enforced by backend)
                        fullWidth
                        label="Endpoint pattern"
                        value={endpointPattern}
                        InputProps={{
                          readOnly: isReadonly,
                        }}
                        InputLabelProps={{ shrink: isReadonly ? true : undefined }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        disabled // at the moment the allowed endpoints cannot be modified (enforced by backend)
                        fullWidth
                        label="URL"
                        value={method}
                        InputProps={{
                          readOnly: isReadonly,
                        }}
                        InputLabelProps={{ shrink: isReadonly ? true : undefined }}
                      />
                    </Grid>
                  </Fragment>
                );
              })
            ) : (
              <Grid item xs={4}>
                <Typography>None</Typography> {/* TODO: in edit mode, allow user to add endpoints */}
              </Grid>
            )}
          </Grid>
          <Typography variant="h4" mb={1}>
            Request Headers
          </Typography>
          <Grid container spacing={2} mb={2}>
            {value.proxy?.spec.headers &&
              Object.keys(value.proxy.spec.headers).map((headerName, i) => {
                return (
                  <Fragment key={i}>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Header name"
                        value={headerName}
                        InputProps={{
                          readOnly: isReadonly,
                        }}
                        InputLabelProps={{ shrink: isReadonly ? true : undefined }}
                        onChange={(e) =>
                          onChange({
                            ...value,
                            ...(value.proxy && {
                              proxy: {
                                ...value.proxy,
                                spec: {
                                  ...value.proxy.spec,
                                  headers: buildNewHeaders(value.proxy.spec.headers, headerName, e.target.value),
                                },
                              },
                            }),
                          })
                        }
                      />
                    </Grid>
                    <Grid item xs={7}>
                      <TextField
                        fullWidth
                        label="Header value"
                        value={value.proxy?.spec.headers?.[headerName]}
                        InputProps={{
                          readOnly: isReadonly,
                        }}
                        InputLabelProps={{ shrink: isReadonly ? true : undefined }}
                        onChange={(e) =>
                          onChange({
                            ...value,
                            ...(value.proxy && {
                              proxy: {
                                ...value.proxy,
                                spec: {
                                  ...value.proxy.spec,
                                  headers: { ...value.proxy.spec.headers, [headerName]: e.target.value },
                                },
                              },
                            }),
                          })
                        }
                      />
                    </Grid>
                    <Grid item xs={1}>
                      <IconButton
                        disabled={isReadonly}
                        onClick={() => {
                          const newHeaders = { ...value.proxy?.spec.headers };
                          delete newHeaders[headerName];
                          onChange({
                            ...value,
                            ...(value.proxy && {
                              proxy: {
                                ...value.proxy,
                                spec: {
                                  ...value.proxy.spec,
                                  headers: newHeaders,
                                },
                              },
                            }),
                          });
                        }}
                      >
                        <MinusIcon />
                      </IconButton>
                    </Grid>
                  </Fragment>
                );
              })}
            <Grid item xs={12} sx={{ paddingTop: '5px !important' }}>
              <IconButton
                disabled={isReadonly}
                onClick={() =>
                  onChange({
                    ...value,
                    ...(value.proxy && {
                      proxy: {
                        ...value.proxy,
                        spec: {
                          ...value.proxy.spec,
                          headers: { ...value.proxy.spec.headers, '': '' },
                        },
                      },
                    }),
                  })
                }
              >
                <PlusIcon />
              </IconButton>
            </Grid>
          </Grid>
          <TextField
            fullWidth
            label="Secret"
            value={value.proxy?.spec.secret || ''}
            InputProps={{
              readOnly: isReadonly,
            }}
            InputLabelProps={{ shrink: isReadonly ? true : undefined }}
            onChange={(e) =>
              onChange({
                ...value,
                ...(value.proxy && {
                  proxy: {
                    ...value.proxy,
                    spec: {
                      ...value.proxy.spec,
                      secret: e.target.value,
                    },
                  },
                }),
              })
            }
          />
        </>
      ),
    },
  ];

  // Use of findIndex instead of providing hardcoded values to avoid desynchronisatio or
  // bug in case the tabs get eventually swapped in the future.
  const directModeId = tabs.findIndex((tab) => tab.label == strDirect);
  const proxyModeId = tabs.findIndex((tab) => tab.label == strProxy);

  // In "update datasource" case, set defaultTab to the mode that this datasource is currently relying on.
  // Otherwise (create datasource), set defaultTab to Direct access.
  const defaultTab = value.proxy ? proxyModeId : directModeId;

  const initialSpecDirect: PrometheusDatasourceSpec = {
    directUrl: '',
  };

  const initialSpecProxy: PrometheusDatasourceSpec = {
    proxy: {
      kind: 'HTTPProxy',
      spec: {
        allowedEndpoints: [
          // hardcoded list of allowed endpoints for now since those are enforced by the backend
          {
            endpointPattern: '/api/v1/labels',
            method: 'POST',
          },
          {
            endpointPattern: '/api/v1/series',
            method: 'POST',
          },
          {
            endpointPattern: '/api/v1/metadata',
            method: 'GET',
          },
          {
            endpointPattern: '/api/v1/query',
            method: 'POST',
          },
          {
            endpointPattern: '/api/v1/query_range',
            method: 'POST',
          },
          {
            endpointPattern: '/api/v1/label/([a-zA-Z0-9_.-]+)/values',
            method: 'GET',
          },
        ],
        url: '',
      },
    },
  };

  // For better user experience, save previous states in mind for both mode.
  // This avoids losing everything when the user changes their mind back.
  const [previousSpecDirect, setPreviousSpecDirect] = useState(initialSpecDirect);
  const [previousSpecProxy, setPreviousSpecProxy] = useState(initialSpecProxy);

  // When changing mode, remove previous mode's config + append default values for the new mode.
  const handleModeChange = (v: number) => {
    if (tabs[v]?.label == strDirect) {
      setPreviousSpecProxy(value);
      onChange(previousSpecDirect);
    } else if (tabs[v]?.label == strProxy) {
      setPreviousSpecDirect(value);
      onChange(previousSpecProxy);
    }
  };

  return (
    <>
      <Typography variant="h4" mb={1}>
        General Settings
      </Typography>
      <TextField
        fullWidth
        label="Scrape Interval"
        value={value.scrapeInterval || ''}
        placeholder={`Default: ${DEFAULT_SCRAPE_INTERVAL}`}
        InputProps={{
          readOnly: isReadonly,
        }}
        InputLabelProps={{ shrink: isReadonly ? true : undefined }}
        onChange={(e) => onChange({ ...value, scrapeInterval: e.target.value as DurationString })}
      />
      <Typography variant="h4" mt={2}>
        HTTP Settings
      </Typography>
      <OptionsEditorRadios
        isReadonly={isReadonly}
        tabs={tabs}
        defaultTab={defaultTab}
        onModeChange={handleModeChange}
      />
    </>
  );
}
