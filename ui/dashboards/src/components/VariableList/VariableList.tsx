// Copyright 2022 The Perses Authors
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

import { Stack, StackProps, Typography } from '@mui/material';
import { ErrorAlert } from '@perses-dev/components';
import { DashboardSpec } from '@perses-dev/core';
import { PluginBoundary, useTemplateVariables } from '@perses-dev/plugin-system';
import { useTemplateVariablesSetters } from '../../context';
import { VariableAutocomplete } from '../VariableAutocomplete';

export interface VariableListProps extends StackProps {
  variables: DashboardSpec['variables'];
}

/**
 * Displays the list of variable inputs for a dashboard.
 */
export function VariableList(props: VariableListProps) {
  const { variables, ...others } = props;

  const { variables: variablesState } = useTemplateVariables();
  const { setValue, setOptions } = useTemplateVariablesSetters();

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2} {...others}>
      <Typography variant="body2" sx={{ fontWeight: (theme) => theme.typography.fontWeightMedium }}>
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
              TextFieldProps={{
                margin: 'none',
              }}
              sx={{ minWidth: 250 }}
            />
          </PluginBoundary>
        );
      })}
    </Stack>
  );
}
