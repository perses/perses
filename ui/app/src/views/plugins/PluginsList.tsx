import { useSnackbar } from '@perses-dev/components';
import { PluginModuleResource } from '@perses-dev/plugin-system';
import { ReactElement, useEffect, useState } from 'react';

export function PluginsList(): ReactElement {
  const [plugins, setPlugins] = useState<PluginModuleResource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
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
    <div>
      <h2>Plugins List</h2>
      <ul>
        {plugins.map((plugin) => (
          <li key={plugin?.metadata?.name}>
            <strong>{plugin?.metadata?.name}</strong>: {plugin?.metadata?.version}
          </li>
        ))}
      </ul>
    </div>
  );
}
