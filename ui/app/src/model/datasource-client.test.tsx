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

import type { DatasourceResource } from '@perses-dev/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';

import {
  resource,
  useCreateDatasourceMutation,
  useDeleteDatasourceMutation,
  useUpdateDatasourceMutation,
} from './datasource-client';

const DATASOURCE = {
  kind: 'Datasource',
  metadata: { name: 'prometheus', project: 'myproject' },
  spec: { default: true, plugin: { kind: 'PrometheusDatasource', spec: {} } },
} as DatasourceResource;

const ALL_PROJECTS_LIST_KEY = [resource];
const PROJECT_LIST_KEY = [resource, 'myproject'];
const OTHER_PROJECT_LIST_KEY = [resource, 'otherproject'];

describe('datasource mutations', () => {
  let queryClient: QueryClient;
  const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient();
    for (const queryKey of [ALL_PROJECTS_LIST_KEY, PROJECT_LIST_KEY, OTHER_PROJECT_LIST_KEY]) {
      queryClient.setQueryData(queryKey, []);
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(DATASOURCE), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const testCases = [
    { title: 'create', useMutation: useCreateDatasourceMutation },
    { title: 'update', useMutation: useUpdateDatasourceMutation },
    { title: 'delete', useMutation: useDeleteDatasourceMutation },
  ];

  testCases.forEach(({ title, useMutation }) => {
    it(`should invalidate the list of the project and the list of all the projects on ${title}`, async () => {
      const { result } = renderHook(() => useMutation('myproject'), { wrapper });

      await act(() => result.current.mutateAsync(DATASOURCE));

      expect(queryClient.getQueryState(PROJECT_LIST_KEY)?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(ALL_PROJECTS_LIST_KEY)?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(OTHER_PROJECT_LIST_KEY)?.isInvalidated).toBe(false);
    });
  });
});
