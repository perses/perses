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

import { Paper, Typography } from '@mui/material';
import { ErrorAlert } from '@perses-dev/components';
import { useDashboardSpec } from '@perses-dev/core';
import { PluginBoundary } from '@perses-dev/plugin-system';
import VariableAutocomplete from './VariableAutocomplete';

const DRAWER_WIDTH = 296;

/**
 * Dashboard options drawer that includes variable inputs.
 */
function OptionsDrawer() {
  const spec = useDashboardSpec();

  return (
    <Paper
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        padding: (theme) => theme.spacing(1, 2),
        borderLeft: (theme) => `1px solid ${theme.palette.divider}`,
      }}
      square
      elevation={0}
    >
      <Typography component="h2" variant="h6">
        Variables
      </Typography>
      {Object.entries(spec.variables).map(([key, variableDef]) => {
        if (variableDef.display.hide === true) return null;

        return (
          <PluginBoundary key={key} loadingFallback="Loading..." ErrorFallbackComponent={ErrorAlert}>
            <VariableAutocomplete variableName={key} definition={variableDef} />
          </PluginBoundary>
        );
      })}
    </Paper>
  );
}

export default OptionsDrawer;
