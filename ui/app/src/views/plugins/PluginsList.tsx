import { useSnackbar } from '@perses-dev/components';
import { PluginModuleResource } from '@perses-dev/plugin-system';
import { Box, Card, CardContent, Typography, Paper, useTheme, Divider } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ReactElement, useEffect, useState } from 'react';

export function PluginsList(): ReactElement {
  const [plugins, setPlugins] = useState<PluginModuleResource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
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

  const renderPluginDetails = (plugin: PluginModuleResource) => {
    if (!plugin?.spec?.plugins || plugin?.spec?.plugins.length === 0) {
      return <Typography variant="body2">No plugins available</Typography>;
    }

    if (plugin?.spec?.plugins.length > 1) {
      return <Typography variant="body2">{plugin?.spec?.plugins.length} plugins</Typography>;
    }

    const singlePlugin = plugin?.spec?.plugins[0];

    return (
      <>
        <Typography variant="body2">Kind: {singlePlugin?.spec?.name}</Typography>
      </>
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
        <Typography variant="h3">Available plugins in this Perses instance:</Typography>
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
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
