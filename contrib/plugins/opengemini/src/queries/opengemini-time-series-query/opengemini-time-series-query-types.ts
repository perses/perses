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

import { DatasourceSelector } from '@perses-dev/core';

/**
 * OpenGemini time series query specification.
 */
export interface OpenGeminiTimeSeriesQuerySpec {
    /**
     * Optional datasource selector. If not provided, the default OpenGemini datasource will be used.
     */
    datasource?: DatasourceSelector;

    /**
     * InfluxQL query string.
     * Example: SELECT mean("value") FROM "cpu" WHERE time > now() - 1h GROUP BY time(1m)
     */
    query: string;

    /**
     * Database name to query against.
     */
    database: string;
}
