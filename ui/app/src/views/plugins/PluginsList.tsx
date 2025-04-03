import { useSnackbar } from '@perses-dev/components';
import { PluginModuleResource } from '@perses-dev/plugin-system';
import {
  Box,
  Card,
  CardContent,
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

  const renderPluginDetails = (pluginModule: PluginModuleResource): ReactElement | null => {
    if (!pluginModule?.spec?.plugins || pluginModule?.spec?.plugins.length === 0) {
      return <Typography variant="body2">No plugins available</Typography>;
    }

    if (pluginModule?.spec?.plugins.length === 1) {
      const singlePlugin = pluginModule?.spec?.plugins[0];
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" color="text.secondary">
            <strong>Kind:</strong> {singlePlugin?.kind}
          </Typography>
        </Box>
      );
    }

    if (pluginModule?.spec?.plugins.length > 1) {
      return (
        <Box>
          <Button color="info" size="small" onClick={() => handleOpenPluginDetails(pluginModule)}>
            View {pluginModule.spec.plugins.length} Plugins
          </Button>
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
        <DialogTitle>Plugins for {selectedPluginModule.metadata.name} Module</DialogTitle>
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
              <Typography variant="h3">{pluginItem.spec.name}</Typography>
              <Typography variant="body1" color="text.secondary">
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
    return (
      <Box>
        <Typography>No plugins found 😢</Typography>
      </Box>
    );
  }

  // Render the list of plugins
  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        {plugins.map((pluginModule) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={pluginModule.metadata.name}>
            <Card
              elevation={1}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[2],
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                {/* <CardContent sx={{ mb: 0 }}> */}
                <Typography variant="h3" component="div" gutterBottom>
                  {pluginModule?.metadata?.name}
                </Typography>
                <Typography color="text.secondary">Version {pluginModule.metadata.version}</Typography>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ mt: 'auto' }}>{renderPluginDetails(pluginModule)}</Box>
                {/* {renderPluginDetails(pluginModule)} */}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <PluginDetailsDialog />
    </Box>
  );
}
