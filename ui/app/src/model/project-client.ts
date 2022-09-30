// Copyright 2022 The Perses Authors
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

import { fetchJson, Metadata } from '@perses-dev/core';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import buildURL from './url-builder';

const resource = 'projects';

export interface ProjectModel {
  kind: 'Project';
  metadata: Metadata;
}

type ProjectListOptions = Omit<UseQueryOptions<ProjectModel[], Error>, 'queryKey' | 'queryFn'>;

/**
 * Gets version information from the Perses server API.
 */
export function useProjectQuery(options?: ProjectListOptions) {
  return useQuery<ProjectModel[], Error>(
    [resource],
    () => {
      const url = buildURL({ resource });
      return fetchJson<ProjectModel[]>(url);
    },
    options
  );
}
