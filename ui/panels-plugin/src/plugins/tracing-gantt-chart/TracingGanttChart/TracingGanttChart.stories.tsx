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
import { MOCK_TRACE } from '../../../test';
import { TracingGanttChart } from './TracingGanttChart';

const exampleTraces = {
  Demo: MOCK_TRACE,
};

const meta: Meta<typeof TracingGanttChart> = {
  component: TracingGanttChart,
  argTypes: {
    trace: {
      options: Object.keys(exampleTraces),
      mapping: exampleTraces,
    },
  },
};

export default meta;

type Story = StoryObj<typeof TracingGanttChart>;

export const Primary: Story = {
  args: {
    options: {
      visual: {
        palette: {
          mode: 'auto',
        },
      },
    },
    trace: exampleTraces.Demo,
  },
};
