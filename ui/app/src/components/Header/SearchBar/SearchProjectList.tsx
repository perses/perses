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

import Archive from 'mdi-material-ui/Archive';
import { useCallback, useMemo } from 'react';
import type { ReactElement } from 'react';

import { useProjectList } from '../../../model/project-client';
import type { ResourceListProps } from './model';
import { SearchList } from './SearchList';

export function SearchProjectList(props: ResourceListProps): ReactElement | null {
  const projectsQueryResult = useProjectList({ refetchOnMount: false });
  const { query, onClick, isResources } = props;
  const handleIsResource = useCallback(
    (isAvailable: boolean): void => isResources?.('projects', isAvailable),
    [isResources],
  );

  const listData = useMemo(() => {
    return projectsQueryResult.data ?? [];
  }, [projectsQueryResult.data]);

  return <SearchList list={listData} query={query} onClick={onClick} icon={Archive} isResource={handleIsResource} />;
}
