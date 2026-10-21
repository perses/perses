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

import type { DatasourceStoreProviderProps } from '@perses-dev/dashboards';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { vi } from 'vitest';

import { ExploreWorkspace } from './ExploreWorkspace';

interface MockPlugin {
  module: { name: string };
  spec: { name: string; display: { name: string } };
}

const plugin = (moduleName: string, name: string): MockPlugin => ({
  module: { name: moduleName },
  spec: { name, display: { name } },
});

const mocks = vi.hoisted(() => ({
  passThrough: (props: { children?: ReactNode }): ReactNode => props.children,
  setExplorer: vi.fn(),
  state: { plugins: [] as MockPlugin[], explorer: undefined as string | undefined },
}));
const { setExplorer, state } = mocks;

vi.mock('@perses-dev/components', () => ({
  ChartsProvider: mocks.passThrough,
  useChartsTheme: (): object => ({}),
}));

vi.mock('@perses-dev/dashboards', () => ({
  DatasourceStoreProvider: mocks.passThrough,
  VariableProvider: mocks.passThrough,
  DEFAULT_DASHBOARD_DURATION: '1h',
  DEFAULT_REFRESH_INTERVAL: '0s',
}));

vi.mock('@perses-dev/explore', () => ({
  ExploreToolbar: (): null => null,
  ExplorerManagerProviderWithQueryParams: mocks.passThrough,
  getExplorerKey: (p: MockPlugin): string => `${p.module.name}-${p.spec.name}`,
  useExplorerManagerContext: (): object => ({ explorer: mocks.state.explorer, setExplorer: mocks.setExplorer }),
  useSortedExplorerPlugins: (): MockPlugin[] => mocks.state.plugins,
}));

vi.mock('@perses-dev/plugin-system', () => ({
  PluginLoaderComponent: (props: { plugin: { name: string } }): ReactNode => `Explorer ${props.plugin.name}`,
  TimeRangeProviderWithQueryParams: mocks.passThrough,
  useInitialRefreshInterval: (): string => '0s',
  useInitialTimeRange: (): string => '1h',
  usePluginRegistry: (): object => ({ pluginsBaseURL: '/plugins' }),
}));

vi.mock('./LogsExplorer', () => ({
  LogsExplorer: (): string => 'Logs explorer',
}));

// The datasource store provider is mocked, so the API is never called.
const datasourceApi = {} as DatasourceStoreProviderProps['datasourceApi'];

function renderWorkspace(): void {
  render(<ExploreWorkspace datasourceApi={datasourceApi} />);
}

describe('ExploreWorkspace', () => {
  beforeEach(() => {
    state.plugins = [
      plugin('Prometheus', 'PrometheusExplorer'),
      plugin('LogExplorer', 'LogExplorer'),
      plugin('Tempo', 'TempoExplorer'),
      plugin('AlertManager', 'AlertManagerAlertsExplorer'),
      plugin('AlertManager', 'AlertManagerSilencesExplorer'),
      plugin('Custom', 'CustomExplorer'),
    ];
    state.explorer = undefined;
    setExplorer.mockClear();
  });

  it('shows a tab per signal, then the other explorers', () => {
    renderWorkspace();
    const tabs = screen.getAllByRole('tab').map((tab) => tab.textContent);
    expect(tabs).toEqual(['Metrics', 'Logs', 'Traces', 'Profiling', 'Alerts', 'Silences', 'CustomExplorer']);
    expect(screen.getByRole('tab', { name: 'Metrics' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Explorer PrometheusExplorer')).toBeInTheDocument();
  });

  it('switches the explorer when a tab is selected', () => {
    renderWorkspace();
    userEvent.click(screen.getByRole('tab', { name: 'Traces' }));
    expect(setExplorer).toHaveBeenCalledWith('Tempo-TempoExplorer');
  });

  it('uses the logs explorer for the Logs tab', () => {
    state.explorer = 'LogExplorer-LogExplorer';
    renderWorkspace();
    expect(screen.getByText('Logs explorer')).toBeInTheDocument();
  });

  it('shows a placeholder when the explorer plugin of a signal is not installed', () => {
    state.explorer = 'placeholder-profiling';
    renderWorkspace();
    expect(screen.getByText(/Profiling exploration is not available yet/)).toBeInTheDocument();
  });
});
