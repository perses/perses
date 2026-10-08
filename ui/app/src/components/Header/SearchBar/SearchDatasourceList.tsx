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

import { useCallback } from 'react';
import type { ReactElement } from 'react';

import { useDatasourceList } from '../../../model/datasource-client';
import type { ResourceListProps } from './model';
import { SearchList } from './SearchList';

export function SearchDatasourceList(props: ResourceListProps): ReactElement | null {
  const datasourceQueryResult = useDatasourceList({ refetchOnMount: false });
  const { isResources, handleClose, query } = props;
  const handleIsResource = useCallback(
    (isAvailable: boolean): void => isResources?.('datasources', isAvailable),
    [isResources],
  );
  return (
    <SearchList
      list={datasourceQueryResult.data ?? []}
      query={query}
      handleClose={handleClose}
      isResource={handleIsResource}
    />
  );
}
