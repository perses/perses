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

import { fetchJson, ProjectMetadata, StatusError } from '@perses-dev/client';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { HTTPHeader, HTTPMethodGET } from './http';
import buildURL from './url-builder';

export interface SearchProjectResource {
  metadata: ProjectMetadata;
  displayName: string;
}

export function useSearchDashboards(
  project?: string,
  searchQuery?: string,
): UseQueryResult<SearchProjectResource[], StatusError> {
  return useQuery<SearchProjectResource[], StatusError>({
    queryKey: ['search/dashboards', project, searchQuery],
    queryFn: () => searchDashboards(project, searchQuery),
  });
}

function searchDashboards(project?: string, searchQuery?: string): Promise<SearchProjectResource[]> {
  const queryParams = new URLSearchParams();
  if (searchQuery) {
    queryParams.set('query', searchQuery);
  }
  if (project) {
    queryParams.set('project', project);
  }
  const url = buildURL({ resource: 'search/dashboards', queryParams: queryParams });
  return fetchJson<SearchProjectResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}
