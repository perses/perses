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

import { TimeSeriesQueryPlugin, parseVariables } from '@perses-dev/plugin-system';
import { getTimeSeriesData } from './get-time-series-data';
import { OpenGeminiTimeSeriesQueryEditor } from './OpenGeminiTimeSeriesQueryEditor';
import { OpenGeminiTimeSeriesQuerySpec } from './opengemini-time-series-query-types';

/**
 * OpenGemini Time Series Query Plugin.
 * Allows querying OpenGemini using InfluxQL and displaying results in time series panels.
 */
export const OpenGeminiTimeSeriesQuery: TimeSeriesQueryPlugin<OpenGeminiTimeSeriesQuerySpec> = {
    getTimeSeriesData,
    OptionsEditorComponent: OpenGeminiTimeSeriesQueryEditor,
    createInitialOptions: () => ({
        query: '',
        database: '',
    }),
    dependsOn: (spec) => {
        // Parse variables from the query string
        const queryVariables = parseVariables(spec.query);
        const databaseVariables = parseVariables(spec.database);
        const allVariables = [...new Set([...queryVariables, ...databaseVariables])];
        return {
            variables: allVariables,
        };
    },
};
