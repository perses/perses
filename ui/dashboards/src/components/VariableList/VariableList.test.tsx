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

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JsonObject, VariableDefinition } from '@perses-dev/core';
import { PluginRegistry, VariablePlugin } from '@perses-dev/plugin-system';
import { mockPluginRegistryProps, renderWithContext } from '../../test';
import { TemplateVariablesProvider } from '../../context';
import { VariableList } from './VariableList';

describe('VariableList', () => {
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

  const FAKE_VARIABLE_PLUGIN: VariablePlugin<JsonObject> = {
    useVariableOptions: () => {
      return {
        data: ['node', 'all'],
        loading: false,
        error: undefined,
      };
    },
  };

  const renderVariableOptionsDrawer = () => {
    const { addMockPlugin, pluginRegistryProps } = mockPluginRegistryProps();
    addMockPlugin('Variable', 'PrometheusLabelValues', FAKE_VARIABLE_PLUGIN);
    renderWithContext(
      <PluginRegistry {...pluginRegistryProps}>
        <TemplateVariablesProvider variableDefinitions={variables}>
          <VariableList variables={variables} />
        </TemplateVariablesProvider>
      </PluginRegistry>
    );
  };

  it('should display Variables as the title', async () => {
    renderVariableOptionsDrawer();
    const title = await screen.findByText('Variables');
    expect(title).toBeInTheDocument();
  });

  describe('VariableAutocomplete', () => {
    it('should display correct variable', async () => {
      renderVariableOptionsDrawer();
      const jobInput = await screen.findByLabelText('Job');
      expect(jobInput).toBeInTheDocument();
    });

    it('should display correct default value', async () => {
      renderVariableOptionsDrawer();
      const jobValue = await screen.findByDisplayValue('node');
      expect(jobValue).toBeInTheDocument();
    });

    it('should display correct options', async () => {
      renderVariableOptionsDrawer();
      const openButton = await screen.findByRole('button', { name: 'Open' });
      userEvent.click(openButton);
      const option1 = await screen.findByText('all');
      expect(option1).toBeInTheDocument();
      const option2 = screen.getByText('node');
      expect(option2).toBeInTheDocument();
    });
  });
});
