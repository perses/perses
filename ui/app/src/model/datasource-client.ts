// Copyright 2021 The Perses Authors
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

import { useQuery, UseQueryOptions } from 'react-query';
import { fetchJson, GlobalDatasourceModel } from '@perses-ui/core';
import buildURL from './url-builder';

const resource = 'globaldatasources';

type GlobalDatasourceListOptions = Omit<UseQueryOptions<GlobalDatasourceModel[], Error>, 'queryKey' | 'queryFn'>;

export function useGlobalDatasourceQuery(options?: GlobalDatasourceListOptions) {
  return useQuery<GlobalDatasourceModel[], Error>(
    resource,
    () => {
      const url = buildURL({ resource });
      return fetchJson<GlobalDatasourceModel[]>(url);
    },
    options
  );
}
