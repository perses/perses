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

import { isProjectMetadata } from '@perses-dev/client';
import type { Resource } from '@perses-dev/client';
import DatabaseIcon from 'mdi-material-ui/Database';
import { useCallback, useMemo } from 'react';
import type { ReactElement } from 'react';

import { useDatasourceList } from '../../../model/datasource-client';
import { ProjectRoute } from '../../../model/route';
import type { ResourceListProps } from './model';
import { SearchList } from './SearchList';

export function SearchDatasourceList(props: ResourceListProps): ReactElement | null {
  const datasourceQueryResult = useDatasourceList({ refetchOnMount: false });
  const { isResources, onClick, query } = props;

  const handleIsResource = useCallback(
    (isAvailable: boolean): void => isResources?.('datasources', isAvailable),
    [isResources],
  );

  const handleBuildRoute = useCallback((resource: Resource) => {
    return `${ProjectRoute}/${isProjectMetadata(resource.metadata) ? resource.metadata.project : ''}/datasources`;
  }, []);

  const listData = useMemo(() => {
    return datasourceQueryResult.data ?? [];
  }, [datasourceQueryResult.data]);

  return (
    <SearchList
      list={listData}
      query={query}
      onClick={onClick}
      icon={DatabaseIcon}
      chip={true}
      buildRouting={handleBuildRoute}
      isResource={handleIsResource}
    />
  );
}
