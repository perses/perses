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

import { fireEvent, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { JsonObject, VariableDefinition } from '@perses-dev/core';
import { PluginRegistrationConfig, PluginRegistry } from '@perses-dev/plugin-system';
import { mockPluginRegistryProps, renderWithContext } from '../../test';
import { TemplateVariablesProvider } from '../../context';
import { VariableOptionsDrawer } from './VariableOptionsDrawer';

describe('VariableOptionsDrawer', () => {
  const variables: Record<string, VariableDefinition> = {
    job: {
      display: {
        label: 'Job',
      },
      kind: 'PrometheusLabelValues',
      selection: {
        default_value: 'node',
      },
      options: {
        label_name: 'job',
        match: ['node_uname_info'],
      },
    },
  };

  const options: any = {
    data: ['node', 'all'],
    isLoading: false,
    error: undefined,
  };

  const FAKE_PANEL_PLUGIN: PluginRegistrationConfig<JsonObject> = {
    pluginType: 'Variable',
    kind: 'PrometheusLabelValues',
    plugin: {
      useVariableOptions: () => {
        return options;
      },
    },
  };

  const renderVariableOptionsDrawer = () => {
    const { addMockPlugin, pluginRegistryProps } = mockPluginRegistryProps();
    addMockPlugin(FAKE_PANEL_PLUGIN);
    renderWithContext(
      <PluginRegistry {...pluginRegistryProps}>
        <TemplateVariablesProvider variableDefinitions={variables}>
          <VariableOptionsDrawer variables={variables} />
        </TemplateVariablesProvider>
      </PluginRegistry>
    );
  };

  it('should display Variables as the title', async () => {
    renderVariableOptionsDrawer();
    await screen.findByText('Variables');
  });

  describe('VariableAutocomplete', () => {
    it('should display correct variable', async () => {
      renderVariableOptionsDrawer();
      await screen.findByLabelText('Job');
    });

    it('should display correct default value', async () => {
      renderVariableOptionsDrawer();
      await screen.findByDisplayValue('node');
    });

    it('should display correct options', async () => {
      renderVariableOptionsDrawer();
      const openButton = await screen.findByRole('button', { name: 'Open' });
      act(() => {
        fireEvent(
          openButton,
          new MouseEvent('click', {
            bubbles: true,
          })
        );
      });
      await screen.findByText('all');
      await screen.findByText('node');
    });
  });
});
