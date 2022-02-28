// Copyright 2021 The Perses Authors
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

import { Paper, Typography, PaperProps } from '@mui/material';
import { ErrorAlert, combineSx } from '@perses-dev/components';
import { DashboardSpec } from '@perses-dev/core';
import { PluginBoundary, useTemplateVariables } from '@perses-dev/plugin-system';
import { useTemplateVariablesSetters } from '../context';
import { VariableAutocomplete } from './VariableAutocomplete';

const DRAWER_WIDTH = 296;

export interface VariableOptionsDrawerProps extends PaperProps {
  variables: DashboardSpec['variables'];
}

/**
 * Dashboard options drawer that includes variable inputs.
 */
export function VariableOptionsDrawer(props: VariableOptionsDrawerProps) {
  const { variables, sx, ...others } = props;

  const { variables: variablesState } = useTemplateVariables();
  const { setValue, setOptions } = useTemplateVariablesSetters();

  return (
    <Paper
      sx={combineSx(
        {
          width: DRAWER_WIDTH,
          flexShrink: 0,
          padding: (theme) => theme.spacing(1, 2),
          borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
        },
        sx
      )}
      square
      elevation={0}
      {...others}
    >
      <Typography component="h2" variant="h6">
        Variables
      </Typography>
      {Object.entries(variables).map(([variableName, variableDef]) => {
        if (variableDef.display.hide === true) return null;

        const variableState = variablesState[variableName];
        if (variableState === undefined) {
          const error = new Error(`Variable state for '${variableName}' not found`);
          return <ErrorAlert key={variableName} error={error} />;
        }

        return (
          <PluginBoundary key={variableName} loadingFallback="Loading..." ErrorFallbackComponent={ErrorAlert}>
            <VariableAutocomplete
              definition={variableDef}
              state={variableState}
              onChange={(value) => setValue(variableName, value)}
              onOptionsChange={(options) => setOptions(variableName, options)}
            />
          </PluginBoundary>
        );
      })}
    </Paper>
  );
}
