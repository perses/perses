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

import { DurationString } from '@perses-dev/core';
import { HTTPSettingsEditor } from '@perses-dev/plugin-system';
import { TextField, Typography } from '@mui/material';
import React, { ReactElement } from 'react';
import { DEFAULT_SCRAPE_INTERVAL, PrometheusDatasourceSpec } from './types';

export interface PrometheusDatasourceEditorProps {
  value: PrometheusDatasourceSpec;
  onChange: (next: PrometheusDatasourceSpec) => void;
  isReadonly?: boolean;
}

export function PrometheusDatasourceEditor(props: PrometheusDatasourceEditorProps): ReactElement {
  const { value, onChange, isReadonly } = props;

  const initialSpecDirect: PrometheusDatasourceSpec = {
    directUrl: '',
  };

  const initialSpecProxy: PrometheusDatasourceSpec = {
    proxy: {
      kind: 'HTTPProxy',
      spec: {
        allowedEndpoints: [
          // list of standard endpoints suggested by default
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
            endpointPattern: '/api/v1/label/([a-zA-Z0-9_-]+)/values',
            method: 'GET',
          },
          {
            endpointPattern: '/api/v1/parse_query',
            method: 'POST',
          },
        ],
        url: '',
      },
    },
  };

  return (
    <>
      <Typography variant="h4" mb={2}>
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
      <HTTPSettingsEditor
        value={value}
        onChange={onChange}
        isReadonly={isReadonly}
        initialSpecDirect={initialSpecDirect}
        initialSpecProxy={initialSpecProxy}
      />
    </>
  );
}
