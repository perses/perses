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
import { BarChart, BarChartOptions } from '@perses-dev/panels-plugin';
import { ReactElement, useState } from 'react';
import { OptionsEditorTabs } from '@perses-dev/plugin-system';
import { PanelDefinition } from '@perses-dev/core';
import { produce } from 'immer';
import { action } from '@storybook/addon-actions';

type PanelOptionsEditorWrapperProps = {
  /**
   * Panel definition used to initialize the options editor in storybook.
   */
  initialPanelDefinition: PanelDefinition<BarChartOptions>;
};

const PanelOptionsEditorWrapper = ({ initialPanelDefinition }: PanelOptionsEditorWrapperProps): ReactElement => {
  const [panelDefinition, setPanelDefinition] = useState<PanelDefinition<BarChartOptions>>(initialPanelDefinition);

  function handleChange(newChartOptions: BarChartOptions): void {
    action('onChange')(newChartOptions);
    setPanelDefinition(
      produce(panelDefinition, (draft) => {
        draft.spec.plugin.spec = newChartOptions;
      })
    );
  }

  const tabs =
    BarChart.panelOptionsEditorComponents?.map(({ label, content: OptionsEditorComponent }) => ({
      label,
      content: <OptionsEditorComponent value={panelDefinition.spec.plugin.spec} onChange={handleChange} />,
    })) || [];

  return <OptionsEditorTabs tabs={tabs} />;
};

/**
 * The panel options editor for the `BarChart` panel plugin.
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
          name: 'Bar Chart Panel',
        },
        plugin: {
          kind: 'BarChart',
          spec: {
            calculation: 'first',
            format: {
              unit: 'decimal',
            },
            sort: 'desc',
            mode: 'value',
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
