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

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { WithQueryClient } from '@perses-dev/storybook';
import { action } from '@storybook/addon-actions';
import { WithPluginRegistry, WithPluginSystemDatasourceStore } from '../../stories/shared-utils';
import { MultiQueryEditor, MultiQueryEditorProps } from './MultiQueryEditor';

function MultiQueryEditorWrapper(props: MultiQueryEditorProps) {
  const [queries, setQueries] = useState<MultiQueryEditorProps['queries']>([]);

  const handleChange: MultiQueryEditorProps['onChange'] = (newQueries) => {
    action('onChange')(newQueries);
    setQueries(newQueries);
  };

  return <MultiQueryEditor {...props} onChange={handleChange} queries={queries} />;
}

const meta: Meta<typeof MultiQueryEditor> = {
  component: MultiQueryEditor,
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
  decorators: [WithPluginSystemDatasourceStore, WithPluginRegistry, WithQueryClient],
  render: (args) => {
    return <MultiQueryEditorWrapper {...args} />;
  },
};

export default meta;

type Story = StoryObj<typeof MultiQueryEditor>;

export const Primary: Story = {
  args: {
    queryTypes: ['TimeSeriesQuery'],
  },
};

export const Multiple: Story = {
  args: {
    queryTypes: ['TimeSeriesQuery', 'TraceQuery'],
  },
};
