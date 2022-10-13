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

import React from 'react';
import { screen } from '@testing-library/react';
import { PluginType } from '../../model';
import { useListPluginMetadata, usePlugin } from '../PluginRegistry';
import { renderWithContext } from '../../test';

describe('PluginRegistry', () => {
  const renderPluginRegistry = (children: React.ReactNode) => {
    renderWithContext(children);
  };

  it('can load a plugin that exists', async () => {
    renderPluginRegistry(<PluginConsumer pluginType="Variable" kind="ErnieVariable" />);

    const hasPlugin = await screen.findByText('Has plugin: true', undefined, { timeout: 3000 });
    expect(hasPlugin).toBeInTheDocument();
  });

  it('errors when plugin is not installed', async () => {
    // This plugin is not in the test metadata at all
    renderPluginRegistry(<PluginConsumer pluginType="TimeSeriesQuery" kind="NotInstalled" />);

    const error = await screen.findByText(/error:/i);
    expect(error).toBeInTheDocument();
    expect(error).toHaveTextContent(/not installed/i);
  });

  it('errors when plugin is missing from the module', async () => {
    // This plugin is in the test metadata, but the code is missing from the module
    renderPluginRegistry(<PluginConsumer pluginType="Variable" kind="MissingErnieVariable" />);

    const error = await screen.findByText(/error:/i);
    expect(error).toBeInTheDocument();
    expect(error).toHaveTextContent(/missing/i);
  });

  it('lists metadata for plugin metadata that exists', async () => {
    // There should be 3 variable plugins across both test modules
    renderPluginRegistry(<MetadataConsumer pluginType="Variable" />);

    const table = await screen.findByRole('table');
    expect(table).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
  });

  it('lists metadata for plugin types with no plugins available', async () => {
    // There are no TimeSeriesQuery plugins in any of the test modules
    renderPluginRegistry(<MetadataConsumer pluginType="TimeSeriesQuery" />);

    const table = await screen.findByRole('table');
    expect(table).toBeInTheDocument();
    const rows = screen.queryAllByRole('row');
    expect(rows).toHaveLength(0);
  });
});

// A helper component for testing the PluginRegistry by calling usePlugin to load a plugin
const PluginConsumer = (props: { pluginType: PluginType; kind: string }) => {
  const { data: plugin, isLoading, error } = usePlugin(props.pluginType, props.kind);
  if (error) {
    return <div>Error: {(error as Error).message}</div>;
  }
  if (isLoading) {
    return <div>Loading</div>;
  }
  return <div>Has plugin: {(plugin !== undefined).toString()}</div>;
};

// A helper component for testing the PluginRegistry metadata APIs by calling useListPluginMetadata
const MetadataConsumer = (props: { pluginType: PluginType }) => {
  const { data: pluginMetadata, isLoading, error } = useListPluginMetadata(props.pluginType);
  if (error) {
    return <div>Error: {(error as Error).message}</div>;
  }
  if (isLoading) {
    return <div>Loading</div>;
  }

  if (pluginMetadata === undefined) {
    return null;
  }

  return (
    <table>
      <tbody>
        {pluginMetadata.map((item) => (
          <tr key={item.kind}>
            <td>{item.pluginType}</td>
            <td>{item.kind}</td>
            <td>{item.display.name}</td>
            <td>{item.display.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
