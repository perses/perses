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
import { TimeSeriesChart } from '@perses-dev/panels-plugin';
import {
  WithDataQueries,
  WithPluginRegistry,
  WithTimeRange,
  WithTemplateVariables,
  WithDatasourceStore,
} from '@perses-dev/plugin-system/src/stories/shared-utils';
import { WithQueryParams, WithQueryClient } from '@perses-dev/storybook';
import { ComponentProps, useState } from 'react';
import { OptionsEditorTabs, OptionsEditorTabsProps, TimeSeriesQueryPlugin } from '@perses-dev/plugin-system';
import { Definition, PanelDefinition } from '@perses-dev/core';
import { produce } from 'immer';
import { action } from '@storybook/addon-actions';
import { TimeSeriesChartOptions } from './time-series-chart-model';

const PanelOptionsEditorWrapper = () => {
  const [panelDefinition, setPanelDefinition] = useState<PanelDefinition<TimeSeriesChartOptions>>({
    kind: 'Panel',
    spec: {
      display: {
        name: 'Time Series Panel',
      },
      plugin: {
        kind: 'TimeSeriesChart',
        spec: {},
      },
    },
  });

  function handleChange(newChartOptions: TimeSeriesChartOptions) {
    action('onChange')(newChartOptions);
    setPanelDefinition(
      produce(panelDefinition, (draft) => {
        draft.spec.plugin.spec = newChartOptions;
      })
    );
  }

  const tabs =
    TimeSeriesChart.panelOptionsEditorComponents?.map(({ label, content: OptionsEditorComponent }) => ({
      label,
      content: <OptionsEditorComponent value={panelDefinition.spec.plugin.spec} onChange={handleChange} />,
    })) || [];

  return <OptionsEditorTabs tabs={tabs} />;
};

// TODO: mock the data response, so we can do visual testing.
const meta: Meta<typeof PanelOptionsEditorWrapper> = {
  component: PanelOptionsEditorWrapper,
  argTypes: {},
  parameters: {},
  decorators: [],
};

export default meta;

type Story = StoryObj<typeof PanelOptionsEditorWrapper>;

export const Primary: Story = {};
