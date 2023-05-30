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
import { TooltipHeader } from '@perses-dev/components';
import { TOOLTIP_MIN_WIDTH } from './tooltip-model';

const meta: Meta<typeof TooltipHeader> = {
  component: TooltipHeader,
  argTypes: {},
  parameters: {
    happo: false,
  },
};

export default meta;

type Story = StoryObj<typeof TooltipHeader>;

export const Primary: Story = {
  args: {
    seriesTimeMs: 1671803580000,
    isTooltipPinned: false,
    totalSeries: 5,
    showAllSeries: false,
  },
  render: (args) => {
    return (
      <div style={{ width: TOOLTIP_MIN_WIDTH, position: 'relative' }}>
        <TooltipHeader {...args} />
      </div>
    );
  },
};
