import { DatasourceGroupingMetadata, DatasourceSelector, GenericDatasource } from '@perses-dev/core';

import { ReactElement, ReactNode, useCallback, useMemo } from 'react';
import { DatasourceSelectItemGroup, DatasourceStore, DatasourceStoreContext } from '@perses-dev/plugin-system';

export interface DatasourceStoreProviderProps {
  children: ReactNode;
  dataSource: GenericDatasource[];
  persesInternal: boolean;
  datasourceGroupingMetadata: DatasourceGroupingMetadata;
}

/* TODO: 3059 */
/**
 * DatasourceStoreProvider is a data source provider context. Children component can get access to the data source store through this context.
 */
export const DatasourceStoreProvider = (props: DatasourceStoreProviderProps): ReactElement => {
  const { children, dataSource, persesInternal, datasourceGroupingMetadata } = props;

  const filterBySelector = useCallback(
    (selector: DatasourceSelector) => {
      const filtered: GenericDatasource[] = [];
      const { name, kind } = selector;
      if (name && kind)
        filtered.push(...dataSource.filter((ds) => ds.metadata.name === name && ds.spec.plugin.kind === kind));
      else filtered.push(...dataSource.filter((ds) => ds.spec.plugin.kind === kind));

      return filtered;
    },
    [dataSource]
  );

  const contextValue = useMemo(
    (): DatasourceStore => ({
      queryDatasource(selector, withPriority): GenericDatasource[] {
        console.log(dataSource, selector, withPriority, persesInternal);

        const filtered = !selector ? [...dataSource] : filterBySelector(selector);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const prioritized = [...filtered];
        return prioritized;
      },
      queryGroupedDatasource(selector): DatasourceSelectItemGroup[] {
        const grouped: DatasourceSelectItemGroup[] = [];
        const filtered = !selector ? [...dataSource] : filterBySelector(selector);

        filtered.forEach((ds) => {
          const index = grouped.findIndex((g) => g.group === ds.kind);
          if (index === -1) {
            grouped.push({
              group: datasourceGroupingMetadata[ds.kind]?.label || ds.kind,
              items: [{ name: ds.metadata.name, selector: { kind: ds.spec.plugin.kind, name: ds.metadata.name } }],
              editLink: datasourceGroupingMetadata[ds.kind]?.editLink,
            });
          } else {
            grouped[index]?.items.push({
              name: ds.metadata.name,
              selector: { kind: ds.spec.plugin.kind, name: ds.metadata.name },
            });
          }
        });

        return grouped;
      },
      getGroupingMetadata(): DatasourceGroupingMetadata {
        return datasourceGroupingMetadata;
      },
    }),
    [dataSource, persesInternal, datasourceGroupingMetadata, filterBySelector]
  );

  return <DatasourceStoreContext.Provider value={contextValue}>{children}</DatasourceStoreContext.Provider>;
};
