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

import { JsonObject, PanelDefinition } from '@perses-dev/core';
import { PluginRegistrationConfig, PluginRegistry } from '@perses-dev/plugin-system';
import { screen } from '@testing-library/react';
import { renderWithContext, mockPluginRegistryProps } from '../test';
import { Panel } from './Panel';

const TEST_DEFINITION: PanelDefinition = {
  kind: 'FakePanel',
  display: {
    name: 'My test panel',
  },
  options: {},
};

const FAKE_PANEL_PLUGIN: PluginRegistrationConfig<JsonObject> = {
  pluginType: 'Panel',
  kind: 'FakePanel',
  plugin: {
    PanelComponent: () => {
      return <div role="figure">FakePanel chart</div>;
    },
  },
};

describe('Panel', () => {
  // Helper to render the panel with some context set
  const renderPanel = () => {
    const { addMockPlugin, pluginRegistryProps } = mockPluginRegistryProps();
    addMockPlugin(FAKE_PANEL_PLUGIN);

    renderWithContext(
      <PluginRegistry {...pluginRegistryProps}>
        <Panel definition={TEST_DEFINITION} />
      </PluginRegistry>
    );
  };

  it('should render Panel', async () => {
    renderPanel();

    const chart = await screen.findByRole('figure');
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveTextContent('FakePanel chart');
  });
});
