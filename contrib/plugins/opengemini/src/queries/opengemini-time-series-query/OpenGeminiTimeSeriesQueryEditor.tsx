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

import React, { ReactElement, ChangeEvent } from 'react';
import { Stack, TextField, Typography } from '@mui/material';
import { OptionsEditorProps } from '@perses-dev/plugin-system';
import { OpenGeminiTimeSeriesQuerySpec } from './opengemini-time-series-query-types';

export type OpenGeminiTimeSeriesQueryEditorProps = OptionsEditorProps<OpenGeminiTimeSeriesQuerySpec>;

/**
 * Editor component for OpenGemini time series queries.
 * Provides fields for database selection and InfluxQL query input.
 */
export function OpenGeminiTimeSeriesQueryEditor(props: OpenGeminiTimeSeriesQueryEditorProps): ReactElement {
    const { value, onChange, isReadonly } = props;

    const handleDatabaseChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange({
            ...value,
            database: event.target.value,
        });
    };

    const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange({
            ...value,
            query: event.target.value,
        });
    };

    return (
        <Stack spacing={2}>
            <TextField
                label="Database"
                value={value.database}
                onChange={handleDatabaseChange}
                disabled={isReadonly}
                placeholder="Enter database name"
                fullWidth
                size="small"
                helperText="The OpenGemini database to query"
            />
            <div>
                <Typography variant="subtitle2" gutterBottom>
                    InfluxQL Query
                </Typography>
                <TextField
                    value={value.query}
                    onChange={handleQueryChange}
                    disabled={isReadonly}
                    placeholder='SELECT mean("value") FROM "measurement" WHERE $timeFilter GROUP BY time($__interval)'
                    fullWidth
                    multiline
                    minRows={3}
                    maxRows={10}
                    size="small"
                    helperText="Enter an InfluxQL query. Use $timeFilter for time range and $__interval for auto-interval."
                />
            </div>
        </Stack>
    );
}
