import { createContext, useContext, useCallback, useMemo } from 'react';
import { DataSourceResource, ResourceSelector } from '@perses-ui/core';
import { useSampleData } from '../utils/temp-sample-data';

export interface DataSourceRegistryContextType {
  getDataSources(selector: ResourceSelector): DataSourceResource[];
}

export const DataSourceRegistryContext = createContext<
  DataSourceRegistryContextType | undefined
>(undefined);

export interface DataSourceRegistryProps {
  children: React.ReactNode;
}

/**
 * Makes DataSource resources available to children.
 */
export function DataSourceRegistry(props: DataSourceRegistryProps) {
  const { children } = props;

  // TODO: Load from Perses server?
  const dataSource = useSampleData<DataSourceResource>('datasource');
  const dataSources: DataSourceResource[] = useMemo(() => {
    if (dataSource === undefined) return [];
    return [dataSource];
  }, [dataSource]);

  const getDataSources = useCallback(
    (selector: ResourceSelector) => {
      // TODO: Is this how K8s selectors actually work?
      return dataSources.filter((d) => {
        for (const key in selector) {
          const value = selector[key];
          if (d.metadata[key] !== value) return false;
        }
        return true;
      });
    },
    [dataSources]
  );

  const context: DataSourceRegistryContextType = useMemo(
    () => ({ getDataSources }),
    [getDataSources]
  );

  return (
    <DataSourceRegistryContext.Provider value={context}>
      {children}
    </DataSourceRegistryContext.Provider>
  );
}

export function useDataSourceRegistry() {
  const context = useContext(DataSourceRegistryContext);
  if (context === undefined) {
    throw new Error(
      'No DataSourceRegistry context found. Did you forget a Provider?'
    );
  }
  return context;
}

export function useDataSources(selector: ResourceSelector) {
  return useDataSourceRegistry().getDataSources(selector);
}
