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
import { useState } from 'react';
import { WithQueryClient } from '@perses-dev/storybook';
import { action } from '@storybook/addon-actions';
import { WithPluginRegistry, WithDatasourceStore } from '../../stories/shared-utils';
import { TimeSeriesQueryEditor, TimeSeriesQueryEditorProps } from './TimeSeriesQueryEditor';

function TimeSeriesQueryEditorWrapper(props: TimeSeriesQueryEditorProps) {
  const [queries, setQueries] = useState<TimeSeriesQueryEditorProps['queries']>([]);

  const handleChange: TimeSeriesQueryEditorProps['onChange'] = (newQueries) => {
    action('onChange')(newQueries);
    setQueries(newQueries);
  };

  return <TimeSeriesQueryEditor {...props} onChange={handleChange} queries={queries} />;
}

const meta: Meta<typeof TimeSeriesQueryEditor> = {
  component: TimeSeriesQueryEditor,
  argTypes: {
    // Disabling these props because we're managing them with `useState` in the wrapper, so it
    // doesn't make sense to let the user modify them.
    queries: {
      table: {
        disable: true,
      },
    },
    onChange: {
      table: {
        disable: true,
      },
    },
  },
  decorators: [WithDatasourceStore, WithPluginRegistry, WithQueryClient],
  render: (args) => {
    return <TimeSeriesQueryEditorWrapper {...args} />;
  },
};

export default meta;

type Story = StoryObj<typeof TimeSeriesQueryEditor>;

export const Primary: Story = {
  args: {},
};
