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

import { DatasourcePlugin } from '@perses-dev/plugin-system';
import { searchTraceQuery, searchTraceID, getEnrichedTraceQuery, TempoClient } from '../model/tempo-client';
import { TempoDatasourceSpec } from './tempo-datasource-types';

/**
 * Creates a TempoClient for a specific datasource spec.
 */
const createClient: DatasourcePlugin<TempoDatasourceSpec, TempoClient>['createClient'] = (spec, options) => {
  const { directUrl } = spec;
  const { proxyUrl } = options;

  // Use the direct URL if specified, but fallback to the proxyUrl by default if not specified
  const datasourceUrl = directUrl ?? proxyUrl;
  if (datasourceUrl === undefined) {
    throw new Error('No URL specified for Tempo client. You can use directUrl in the spec to configure it.');
  }

  return {
    options: {
      datasourceUrl,
    },
    searchTraceQuery: (query: string) => searchTraceQuery(query, datasourceUrl),
    searchTraceID: (traceID: string) => searchTraceID(traceID, datasourceUrl),
    getEnrichedTraceQuery: (query: string) => getEnrichedTraceQuery(query, datasourceUrl),
  };
};

export const TempoDatasource: DatasourcePlugin<TempoDatasourceSpec, TempoClient> = {
  createClient,
  // TODO add a options editor component for tempo datasource
  // OptionsEditorComponent: TempoDatasourceEditor,
  createInitialOptions: () => ({ directUrl: '' }),
};
