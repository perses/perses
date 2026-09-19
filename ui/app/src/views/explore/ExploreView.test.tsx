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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';

import ExploreView from './ExploreView';

let mockProjectParam: string | null | undefined;
const setProjectParam = vi.fn();

vi.mock('use-query-params', () => ({
  StringParam: {},
  useQueryParam: (): [string | null | undefined, typeof setProjectParam] => [mockProjectParam, setProjectParam],
}));

vi.mock('@perses-dev/components', () => ({
  ErrorAlert: (): null => null,
  ErrorBoundary: (props: { children: ReactNode }): ReactNode => props.children,
  getResourceDisplayName: (): string => '',
}));

vi.mock('@perses-dev/explore', () => ({
  ViewExplore: (): null => null,
}));

vi.mock('@perses-dev/plugin-system', () => ({
  PluginRegistry: (props: { children: ReactNode }): ReactNode => props.children,
}));

vi.mock('../../context/Config', () => ({
  useIsProjectDatasourceEnabled: (): boolean => true,
}));

vi.mock('../../model/datasource-api', () => ({
  useDatasourceApi: (): object => ({}),
}));

vi.mock('../../model/remote-plugin-loader', () => ({
  useRemotePluginLoader: (): object => ({}),
}));

vi.mock('../../model/project-client', () => ({
  useProjectList: (): object => ({ data: [] }),
}));

vi.mock('../../model/global-variable-client', () => ({
  useGlobalVariableList: (): object => ({ data: [], isLoading: true }),
}));

vi.mock('../../utils/browser-size', () => ({
  useIsMobileSize: (): boolean => false,
}));

const datasourceQueryKey = ['listDatasourceSelectItems', 'PrometheusDatasource'];

describe('ExploreView datasource scope', () => {
  it.each([undefined, null, 'project-a'])('refreshes datasource choices on entry with project %s', (project) => {
    mockProjectParam = project;
    const queryClient = new QueryClient();
    queryClient.setQueryData(datasourceQueryKey, []);

    render(
      <QueryClientProvider client={queryClient}>
        <ExploreView />
      </QueryClientProvider>,
    );

    expect(queryClient.getQueryState(datasourceQueryKey)?.isInvalidated).toBe(true);
    queryClient.clear();
  });

  it('refreshes datasource choices on project changes, including returning to global scope', () => {
    mockProjectParam = undefined;
    const queryClient = new QueryClient();
    const createView = (): ReactElement => (
      <QueryClientProvider client={queryClient}>
        <ExploreView />
      </QueryClientProvider>
    );
    const { rerender } = render(createView());

    for (const project of ['project-a', 'project-b', undefined]) {
      queryClient.setQueryData(datasourceQueryKey, []);
      rerender(createView());
      expect(queryClient.getQueryState(datasourceQueryKey)?.isInvalidated).toBe(false);

      mockProjectParam = project;
      rerender(createView());
      expect(queryClient.getQueryState(datasourceQueryKey)?.isInvalidated).toBe(true);
    }
    queryClient.clear();
  });
});
