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

import { JsonObject } from '@perses-dev/core';
import { PanelPlugin, PluginRegistry } from '@perses-dev/plugin-system';
import 'intersection-observer';
import { screen } from '@testing-library/react';
import { renderWithContext, mockPluginRegistryProps } from '../../test';
import testDashboard from '../../test/testDashboard';
import { DashboardStoreProps } from '../../context';
import { Panel, PanelProps } from './Panel';

const FAKE_PANEL_PLUGIN: PanelPlugin<JsonObject> = {
  PanelComponent: () => {
    return <div role="figure">FakePanel chart</div>;
  },
  OptionsEditorComponent: () => {
    return <div>Edit options here</div>;
  },
  createInitialOptions: () => ({}),
};

describe('Panel', () => {
  let props: PanelProps;
  let initialState: DashboardStoreProps;

  beforeEach(() => {
    props = {
      definition: {
        display: {
          name: 'Fake Panel',
          description: 'This is a fake panel',
        },
        kind: 'FakePanel',
        options: {},
      },
      groupIndex: 0,
      panelRef: 'panelRef',
    };

    initialState = {
      isEditMode: false,
      dashboardSpec: testDashboard.spec,
    };
  });

  // Helper to render the panel with some context set
  const renderPanel = (initialState?: DashboardStoreProps) => {
    const { addMockPlugin, pluginRegistryProps } = mockPluginRegistryProps();
    addMockPlugin('Panel', 'FakePanel', FAKE_PANEL_PLUGIN);

    renderWithContext(
      <PluginRegistry {...pluginRegistryProps}>
        <Panel {...props} />
      </PluginRegistry>,
      undefined,
      initialState
    );
  };

  it('should render name and info icon', async () => {
    renderPanel();
    await screen.findByText('Fake Panel');
    screen.queryByLabelText('info-tooltip');
  });

  it('should render edit icons when in edit mode', async () => {
    initialState.isEditMode = true;
    renderPanel(initialState);
    await screen.queryByLabelText('drag handle');
    screen.queryByLabelText('edit panel');
    screen.queryByLabelText('more');
  });
});
