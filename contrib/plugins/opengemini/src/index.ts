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

/**
 * OpenGemini Plugin Module for Perses.
 *
 * This module provides datasource and query plugins for connecting to OpenGemini,
 * a CNCF sandbox project for time-series data storage that is compatible with
 * InfluxDB v1.x APIs.
 */

// Datasource exports
export { OpenGeminiDatasource, OpenGeminiDatasourceEditor } from './datasources/opengemini-datasource';
export type {
    OpenGeminiDatasourceSpec,
    OpenGeminiClient,
    OpenGeminiQueryParams,
    OpenGeminiQueryResponse,
    OpenGeminiSeries,
} from './datasources/opengemini-datasource';

// Query exports
export { OpenGeminiTimeSeriesQuery, OpenGeminiTimeSeriesQueryEditor } from './queries/opengemini-time-series-query';
export type { OpenGeminiTimeSeriesQuerySpec } from './queries/opengemini-time-series-query';
