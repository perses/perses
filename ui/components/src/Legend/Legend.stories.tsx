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
import { action } from '@storybook/addon-actions';
import { Legend, LegendProps } from '@perses-dev/components';

const meta: Meta<typeof Legend> = {
  component: Legend,
  render: (args) => <LegendWrapper {...args} />,
  args: {
    height: 100,
    width: 600,
    options: { position: 'Bottom' },
    data: [
      {
        id: 'up{instance="demo.do.prometheus.io:3000",job="grafana"}',
        label: 'up{instance="demo.do.prometheus.io:3000",job="grafana"}',
        isSelected: false,
        color: 'hsla(158782136,50%,50%,0.8)',
        onClick: action('onClickItem'),
      },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof Legend>;

const LegendWrapper = (props: LegendProps) => {
  const wrapperHeight = props.height + 100;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: wrapperHeight,
      }}
    >
      <Legend {...props} />
    </div>
  );
};

export const Primary: Story = {};

/**
 * The legend can be positioned at the bottom.
 */
export const Bottom: Story = {
  args: {
    options: {
      position: 'Bottom',
    },
  },
};

/**
 * The legend can be positioned at the right.
 */
export const Right: Story = {
  args: {
    options: {
      position: 'Right',
    },
  },
};
