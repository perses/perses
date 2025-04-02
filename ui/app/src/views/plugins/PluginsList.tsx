import { useSnackbar } from '@perses-dev/components';
import { PluginModuleResource } from '@perses-dev/plugin-system';
import { Box, Card, CardContent, Typography, Paper, useTheme } from '@mui/material';
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
        <Typography variant="body1">Available plugins in this Perses instance</Typography>
      </Paper>

      <Grid container spacing={3}>
        {plugins.map((plugin) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={plugin.metadata.name}>
            <Card
              elevation={1}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s box-shadow 0.2s',
                '&!hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h3" component="div" gutterBottom>
                  {plugin?.metadata?.name}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  Version {plugin.metadata.version}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <ul>
        {plugins.map((plugin) => (
          <li key={plugin?.metadata?.name}>
            <strong>{plugin?.metadata?.name}</strong>: {plugin?.metadata?.version}
          </li>
        ))}
      </ul>
    </Box>
  );
}
