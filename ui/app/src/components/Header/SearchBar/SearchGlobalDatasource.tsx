// Copyright The Perses Authors
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

import DatabaseIcon from 'mdi-material-ui/Database';
import { useCallback, useMemo } from 'react';
import type { ReactElement } from 'react';

import { useGlobalDatasourceList } from '../../../model/global-datasource-client';
import { AdminRoute } from '../../../model/route';
import type { ResourceListProps } from './model';
import { SearchList } from './SearchList';

export function SearchGlobalDatasource(props: ResourceListProps): ReactElement | null {
  const globalDatasourceQueryResult = useGlobalDatasourceList({ refetchOnMount: false });
  const { query, onClick, isResources } = props;
  const handleIsResource = useCallback(
    (isAvailable: boolean): void => isResources?.('globalDatasources', isAvailable),
    [isResources],
  );

  const handleBuildRouter = useCallback(() => `${AdminRoute}/datasources`, []);

  const listData = useMemo(() => {
    return globalDatasourceQueryResult.data ?? [];
  }, [globalDatasourceQueryResult.data]);

  return (
    <SearchList
      list={listData}
      query={query}
      onClick={onClick}
      icon={DatabaseIcon}
      buildRouting={handleBuildRouter}
      isResource={handleIsResource}
    />
  );
}
