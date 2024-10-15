// Copyright 2024 The Perses Authors
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

import { useDatasourceClient } from '@perses-dev/plugin-system';
import { DatasourceSelector } from '@perses-dev/core';
import { useQuery } from '@tanstack/react-query';
import { ParseQueryRequestParameters, ParseQueryResponse, PrometheusClient } from '../model';

export function useParseQuery(content: string, datasource: DatasourceSelector) {
  const { data: client } = useDatasourceClient<PrometheusClient>(datasource);

  return useQuery<ParseQueryResponse>({
    enabled: !!client,
    queryKey: ['parseQuery', content, 'datasource', datasource],
    queryFn: async () => {
      const params: ParseQueryRequestParameters = { query: content };

      return await client!.parseQuery(params);
    },
  });
}
