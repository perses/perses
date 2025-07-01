import { DatasourceGroupingMetadata, DatasourceSelector, GenericDatasource } from '@perses-dev/core';
import { createContext, useContext } from 'react';

export interface DatasourceStore {
  queryDatasource?: (selector?: DatasourceSelector, withPriority?: boolean) => GenericDatasource[];
  queryGroupedDatasource?: (selector?: DatasourceSelector) => DatasourceSelectItemGroup[];
  getGroupingMetadata?: () => DatasourceGroupingMetadata;
}

export interface DatasourceSelectItemGroup {
  group?: string;
  editLink?: string;
  items: DatasourceSelectItem[];
}

/**
 * Since the datasource is supposed to be provided by the consumers of the Perses libs
 * the deprecated fields don't make sense anymore. For internal usage, the DS priority is guaranteed through the provider
 */
export interface DatasourceSelectItem {
  name: string;
  /**
   * @deprecated
   */
  overridden?: boolean;
  /**
   * @deprecated
   */
  overriding?: boolean;
  /**
   * @deprecated
   */
  saved?: boolean;
  selector: DatasourceSelectItemSelector;
}

/**
 * Datasource Selector used by the frontend only to differentiate datasources coming from different group.
 */
export interface DatasourceSelectItemSelector extends DatasourceSelector {
  /**
   * Group of the datasource.
   * Omit it if you don't store datasource by group.
   */
  group?: string;
}

export const DatasourceStoreContext = createContext<DatasourceStore>({});

export function useDatasourceStore(): DatasourceStore {
  const ctx = useContext(DatasourceStoreContext);
  if (ctx === undefined) {
    throw new Error('No DatasourceStoreContext found. Did you forget a Provider?');
  }
  return ctx;
}
