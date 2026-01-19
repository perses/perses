// Copyright The Perses Authors
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

import { fetch } from '@perses-dev/core';
import { DatasourcePlugin } from '@perses-dev/plugin-system';
import {
    OpenGeminiDatasourceSpec,
    OpenGeminiClient,
    OpenGeminiQueryParams,
    OpenGeminiQueryResponse,
} from './opengemini-datasource-types';
import { OpenGeminiDatasourceEditor } from './OpenGeminiDatasourceEditor';

/**
 * Creates an OpenGemini client that connects to the OpenGemini HTTP API.
 * OpenGemini is InfluxDB v1.x compatible, so we use the standard /query endpoint.
 */
const createClient: DatasourcePlugin<OpenGeminiDatasourceSpec, OpenGeminiClient>['createClient'] = (spec, options) => {
    const { directUrl, proxy } = spec;
    const { proxyUrl } = options;

    // Use the direct URL if specified, but fallback to the proxyUrl by default if not specified
    const datasourceUrl = directUrl ?? proxyUrl;
    if (datasourceUrl === undefined) {
        throw new Error(
            'No URL specified for OpenGemini client. You can use directUrl in the spec to configure it.'
        );
    }

    const specHeaders = proxy?.spec.headers;

    return {
        options: {
            datasourceUrl,
        },
        query: async (params: OpenGeminiQueryParams, headers): Promise<OpenGeminiQueryResponse> => {
            // Build the query URL with parameters
            const queryParams = new URLSearchParams({
                db: params.db,
                q: params.q,
            });

            if (params.epoch) {
                queryParams.set('epoch', params.epoch);
            }

            const url = `${datasourceUrl}/query?${queryParams.toString()}`;

            const init = {
                method: 'GET',
                headers: headers ?? specHeaders,
            };

            const response = await fetch(url, init);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenGemini query failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            try {
                const body = await response.json();
                return body as OpenGeminiQueryResponse;
            } catch (e) {
                console.error('Invalid response from OpenGemini server', e);
                throw new Error('Invalid response from OpenGemini server');
            }
        },
    };
};

/**
 * OpenGemini Datasource Plugin.
 * Provides connectivity to OpenGemini time-series database using InfluxDB-compatible HTTP API.
 */
export const OpenGeminiDatasource: DatasourcePlugin<OpenGeminiDatasourceSpec, OpenGeminiClient> = {
    createClient,
    OptionsEditorComponent: OpenGeminiDatasourceEditor,
    createInitialOptions: () => ({ directUrl: '' }),
};
