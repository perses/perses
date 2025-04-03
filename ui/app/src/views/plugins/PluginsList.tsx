import { useSnackbar } from '@perses-dev/components';
import { PluginModuleResource } from '@perses-dev/plugin-system';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Paper,
  useTheme,
  Divider,
  Button,
  Dialog,
  DialogTitle,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ReactElement, useEffect, useState } from 'react';

export function PluginsList(): ReactElement {
  const [plugins, setPlugins] = useState<PluginModuleResource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPluginModule, setSelectedPluginModule] = useState<PluginModuleResource | null>(null);
  const { exceptionSnackbar } = useSnackbar();
  const theme = useTheme();

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

  const renderPluginDetails = (plugin: PluginModuleResource): ReactElement | null => {
    if (!plugin?.spec?.plugins || plugin?.spec?.plugins.length === 0) {
      return <Typography variant="body2">No plugins available</Typography>;
    }

    if (plugin?.spec?.plugins.length === 1) {
      const singlePlugin = plugin?.spec?.plugins[0];
      return (
        <Box>
          <Typography variant="body2">
            <strong>Plugin:</strong> {singlePlugin?.spec?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Kind: {singlePlugin?.kind}
          </Typography>
        </Box>
      );
    }

    return null;
  };

  const PluginDetailsDialog: () => ReactElement | null = () => {
    if (!selectedPluginModule) {
      return null;
    }

    return (
      <Dialog open={!!selectedPluginModule} onClose={handleClosePluginDetails} maxWidth="sm" fullWidth>
        <DialogTitle>Plugins for {selectedPluginModule.metadata.name}</DialogTitle>
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {selectedPluginModule.spec.plugins.map((pluginItem, index) => (
            <Box
              key={index}
              sx={{
                mb: 2,
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <Typography variant="h6">{pluginItem.spec.display.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Kind: {pluginItem.kind}
              </Typography>
            </Box>
          ))}
        </Box>
      </Dialog>
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    exceptionSnackbar(error);
    return <div>Error: {error}</div>;
  }
  if (plugins.length === 0) {
    return <div>No plugins found</div>;
  }

  // Render the list of plugins
  return (
    <Box>
      <Paper elevation={0} sx={{ p: 3, mb: 2 }}>
        <Typography variant="h3">Available plugin modules in this Perses instance:</Typography>
      </Paper>

      <Grid container spacing={3}>
        {plugins.map((pluginModule) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={pluginModule.metadata.name}>
            <Card
              elevation={1}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h3" component="div" gutterBottom>
                  {pluginModule?.metadata?.name}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  Version {pluginModule.metadata.version}
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                {renderPluginDetails(pluginModule)}
              </CardContent>
              {pluginModule.spec.plugins.length > 1 && (
                <CardActions>
                  <Button color="primary" onClick={() => handleOpenPluginDetails(pluginModule)}>
                    View {pluginModule.spec.plugins.length} Plugins
                  </Button>
                </CardActions>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>
      <PluginDetailsDialog />
    </Box>
  );
}
