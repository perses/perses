import { PluginModuleResource } from '@perses-dev/plugin-system';
import { Box, Card, CardContent, Typography, Divider, Button, CircularProgress, Stack } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ReactElement, useEffect, useState } from 'react';
import { useSnackbar } from '@perses-dev/components';
import { PluginDetailsDialog } from './PluginDetailsDialog';

export function PluginsList(): ReactElement {
  const [plugins, setPlugins] = useState<PluginModuleResource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPluginModule, setSelectedPluginModule] = useState<PluginModuleResource | null>(null);
  const { exceptionSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchPlugins = async (): Promise<void> => {
      try {
        const res = await fetch('/api/v1/plugins');
        if (!res.ok) {
          throw new Error(`Failed to fetch plugins: ${res.statusText}`);
        }
        const data = await res.json();
        setPlugins(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlugins();
  }, []);

  const handleOpenPluginDetails = (pluginModule: PluginModuleResource): void => {
    setSelectedPluginModule(pluginModule);
  };

  const handleClosePluginDetails = (): void => {
    setSelectedPluginModule(null);
  };

  if (isLoading) {
    return (
      <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (error) {
    exceptionSnackbar(error);
  }

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        {plugins.map((pluginModule) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={pluginModule.metadata.name}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h3" component="div" gutterBottom>
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
