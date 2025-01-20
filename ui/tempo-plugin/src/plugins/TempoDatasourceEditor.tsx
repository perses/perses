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

import { HTTPSettingsEditor } from '@perses-dev/plugin-system';
import React, { ReactElement } from 'react';
import { TempoDatasourceSpec } from './tempo-datasource-types';

export interface TempoDatasourceEditorProps {
  value: TempoDatasourceSpec;
  onChange: (next: TempoDatasourceSpec) => void;
  isReadonly?: boolean;
}

export function TempoDatasourceEditor(props: TempoDatasourceEditorProps): ReactElement {
  const { value, onChange, isReadonly } = props;

  const initialSpecDirect: TempoDatasourceSpec = {
    directUrl: '',
  };

  const initialSpecProxy: TempoDatasourceSpec = {
    proxy: {
      kind: 'HTTPProxy',
      spec: {
        allowedEndpoints: [
          // list of standard endpoints suggested by default
          {
            endpointPattern: '/api/search',
            method: 'GET',
          },
          {
            endpointPattern: '/api/traces',
            method: 'GET',
          },
          {
            endpointPattern: '/api/v2/search/tags',
            method: 'GET',
          },
          {
            endpointPattern: '/api/v2/search/tag',
            method: 'GET',
          },
        ],
        url: '',
      },
    },
  };

  return (
    <HTTPSettingsEditor
      value={value}
      onChange={onChange}
      isReadonly={isReadonly}
      initialSpecDirect={initialSpecDirect}
      initialSpecProxy={initialSpecProxy}
    />
  );
}
