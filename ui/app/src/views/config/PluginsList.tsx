// Copyright 2025 The Perses Authors
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

import { Box, Card, CardContent, Typography, Divider, Button } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ReactElement, useState } from 'react';
import { PluginModuleResource } from '@perses-dev/plugin-system';
import { useSnackbar } from '@perses-dev/components';
import { usePlugins } from '../../model/plugin-client';
import { PersesLoader } from '../../components/PersesLoader';
import { PluginDetailsDialog } from './PluginDetailsDialog';

export function PluginsList(): ReactElement {
  const [selectedPluginModule, setSelectedPluginModule] = useState<PluginModuleResource | null>(null);
  const { exceptionSnackbar } = useSnackbar();

  const { data: pluginModules, isLoading, error } = usePlugins();

  if (isLoading || pluginModules === undefined) {
    return <PersesLoader />;
  }

  if (error) {
    exceptionSnackbar(error);
  }

  const handleOpenPluginDetails = (pluginModule: PluginModuleResource): void => {
    setSelectedPluginModule(pluginModule);
  };

  const handleClosePluginDetails = (): void => {
    setSelectedPluginModule(null);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        {pluginModules.map((pluginModule) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={pluginModule.metadata.name}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h3" gutterBottom>
                  {pluginModule?.metadata?.name}
                </Typography>
                <Typography>Version {pluginModule.metadata.version}</Typography>
                <Divider sx={{ my: 1.5 }} />
                <Box>
                  {
                    // Case 1: No plugins available
                    (!pluginModule?.spec?.plugins || pluginModule?.spec?.plugins.length === 0) && (
                      <Typography variant="body2">No plugins available 😢</Typography>
                    )
                  }
                  {
                    // Case 2: Single plugin
                    pluginModule?.spec?.plugins.length === 1 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body1" color="text.secondary">
                          <strong>Kind:</strong> {pluginModule?.spec?.plugins[0]?.kind}
                        </Typography>
                      </Box>
                    )
                  }
                  {
                    // Case 3: Multiple plugins
                    pluginModule?.spec?.plugins.length > 1 && (
                      <Box>
                        <Button color="info" size="small" onClick={() => handleOpenPluginDetails(pluginModule)}>
                          View {pluginModule.spec.plugins.length} Plugins
                        </Button>
                      </Box>
                    )
                  }
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <PluginDetailsDialog selectedPluginModule={selectedPluginModule} onClose={handleClosePluginDetails} />
    </Box>
  );
}
