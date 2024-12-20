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

import { FederationHost } from '@module-federation/enhanced/runtime';
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { PersesPlugin, RemotePluginModule } from './PersesPlugin.types';
import { PluginLoader } from './PluginLoader';
import * as PluginRuntime from './PluginRuntime';

global.fetch = jest.fn(() => Promise.resolve({ ok: true } as Response));

jest.mock('@module-federation/enhanced/runtime', () => ({
  init: jest.fn(() => ({
    options: {
      remotes: [],
    },
    registerRemotes: jest.fn(),
  })),
  loadRemote: jest.fn(),
}));

jest.mock('./PluginRuntime', () => ({
  usePluginRuntime: jest.fn(),
  pluginRuntime: {} as FederationHost,
}));

class SimpleErrorBoundary extends React.Component<React.PropsWithChildren, { error: Error | null }> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  render(): React.ReactNode {
    if (this.state.error !== null) {
      return this.state.error.message;
    }

    return this.props.children;
  }
}

describe('PluginLoader', () => {
  const mockPlugin: PersesPlugin = {
    name: 'test-plugin',
    moduleName: 'test-module',
    baseURL: 'https://example.com',
  };

  it('should render the plugin component', async () => {
    const mockPluginModule = jest.fn(() => <div>Mock Plugin Component</div>);

    jest.spyOn(PluginRuntime, 'usePluginRuntime').mockImplementation(() => ({
      loadPlugin: (): Promise<{ 'test-plugin': () => React.ReactNode }> =>
        Promise.resolve({ 'test-plugin': mockPluginModule }),
      pluginRuntime: {} as FederationHost,
    }));

    act(() => {
      render(<PluginLoader plugin={mockPlugin} />);
    });

    await waitFor(() => {
      expect(mockPluginModule).toHaveBeenCalled();
    });

    expect(screen.getByText('Mock Plugin Component')).toBeInTheDocument();
  });

  it('should throw an error if the plugin module does not have a named export', async () => {
    const mockPluginModule = jest.fn(() => <div>Mock Plugin Component</div>);

    jest.spyOn(PluginRuntime, 'usePluginRuntime').mockImplementation(() => ({
      loadPlugin: (): Promise<RemotePluginModule> => Promise.resolve({ mockPluginModule } as RemotePluginModule),
      pluginRuntime: {} as FederationHost,
    }));

    act(() => {
      render(
        <SimpleErrorBoundary>
          <PluginLoader plugin={mockPlugin} />
        </SimpleErrorBoundary>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('PluginLoader: Plugin module does not have a test-plugin export')).toBeInTheDocument();
    });
  });

  it('should throw an error if the plugin module named export is not a function', async () => {
    jest.spyOn(PluginRuntime, 'usePluginRuntime').mockImplementation(() => ({
      loadPlugin: (): Promise<RemotePluginModule> =>
        Promise.resolve({ 'test-plugin': 'not a function' } as unknown as RemotePluginModule),
      pluginRuntime: {} as FederationHost,
    }));

    act(() => {
      render(
        <SimpleErrorBoundary>
          <PluginLoader plugin={mockPlugin} />
        </SimpleErrorBoundary>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('PluginLoader: Plugin test-plugin export is not a function')).toBeInTheDocument();
    });
  });
});
