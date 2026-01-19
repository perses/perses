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

import { HTTPProxy, RequestHeaders } from '@perses-dev/core';
import { DatasourceClient } from '@perses-dev/plugin-system';

/**
 * OpenGemini datasource specification.
 * Supports either direct URL connection or proxy configuration.
 */
export interface OpenGeminiDatasourceSpec {
    directUrl?: string;
    proxy?: HTTPProxy;
}

/**
 * Query request parameters for OpenGemini (InfluxDB compatible).
 */
export interface OpenGeminiQueryParams {
    db: string;
    q: string;
    epoch?: 'ns' | 'u' | 'ms' | 's' | 'm' | 'h';
}

/**
 * OpenGemini client options.
 */
export interface OpenGeminiClientOptions {
    datasourceUrl: string;
    headers?: RequestHeaders;
}

/**
 * Single series result from OpenGemini.
 */
export interface OpenGeminiSeries {
    name: string;
    columns: string[];
    values: Array<Array<number | string | null>>;
    tags?: Record<string, string>;
}

/**
 * Single statement result from OpenGemini.
 */
export interface OpenGeminiStatementResult {
    statement_id: number;
    series?: OpenGeminiSeries[];
    error?: string;
}

/**
 * Full response from OpenGemini query endpoint.
 */
export interface OpenGeminiQueryResponse {
    results: OpenGeminiStatementResult[];
}

/**
 * OpenGemini datasource client interface.
 */
export interface OpenGeminiClient extends DatasourceClient {
    options: OpenGeminiClientOptions;
    query(params: OpenGeminiQueryParams, headers?: RequestHeaders): Promise<OpenGeminiQueryResponse>;
}
