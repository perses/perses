// Copyright 2023 The Perses Authors
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

import type { Meta, StoryObj } from '@storybook/react';
import { StatChart, StatChartOptions } from '@perses-dev/panels-plugin';
import { useState } from 'react';
import { OptionsEditorTabs } from '@perses-dev/plugin-system';
import { PanelDefinition } from '@perses-dev/core';
import { produce } from 'immer';
import { action } from '@storybook/addon-actions';

type PanelOptionsEditorWrapperProps = {
  /**
   * Panel definition used to initialize the options editor in storybook.
   */
  initialPanelDefinition: PanelDefinition<StatChartOptions>;
};

const PanelOptionsEditorWrapper = ({ initialPanelDefinition }: PanelOptionsEditorWrapperProps) => {
  const [panelDefinition, setPanelDefinition] = useState<PanelDefinition<StatChartOptions>>(initialPanelDefinition);

  function handleChange(newChartOptions: StatChartOptions) {
    action('onChange')(newChartOptions);
    setPanelDefinition(
      produce(panelDefinition, (draft) => {
        draft.spec.plugin.spec = newChartOptions;
      })
    );
  }

  const tabs =
    StatChart.panelOptionsEditorComponents?.map(({ label, content: OptionsEditorComponent }) => ({
      label,
      content: <OptionsEditorComponent value={panelDefinition.spec.plugin.spec} onChange={handleChange} />,
    })) || [];

  return <OptionsEditorTabs tabs={tabs} />;
};

/**
 * The panel options editor for the `StatChart` panel plugin.
 *
 * This component is not intended to be used directly. It is documented in storybook
 * to provide an example of what the plugin settings look like.
 */
const meta: Meta<typeof PanelOptionsEditorWrapper> = {
  component: PanelOptionsEditorWrapper,
  args: {
    initialPanelDefinition: {
      kind: 'Panel',
      spec: {
        display: {
          name: 'Stat Chart Panel',
        },
        plugin: {
          kind: 'StatChart',
          spec: {
            calculation: 'First',
            unit: {
              kind: 'Decimal',
            },
          },
        },
      },
    },
  },
  argTypes: {},
  parameters: {
    docs: {},
  },
  decorators: [],
};

export default meta;

type Story = StoryObj<typeof PanelOptionsEditorWrapper>;

export const Primary: Story = {};
