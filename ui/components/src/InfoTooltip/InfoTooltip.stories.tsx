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
import { InfoTooltip } from '@perses-dev/components';
import { Button } from '@mui/material';

const meta: Meta<typeof InfoTooltip> = {
  component: InfoTooltip,
  argTypes: {
    placement: {
      options: ['top', 'left', 'right', 'bottom'],
      control: 'radio',
    },
    children: {
      control: false,
    },
  },
  parameters: {
    // TODO: investigate how to get snapshots of interactive elements like
    // tooltips. Adding a `play` that hovers to show the tooltip was not enough,
    // so this is likely more complex and may require working with Happo support.
    happo: false,
  },
};

export default meta;

type Story = StoryObj<typeof InfoTooltip>;

export const Primary: Story = {
  args: {
    description: 'My tooltip has a description!',
    children: <Button variant="outlined">hover for a tooltip</Button>,
  },
};

/**
 * A tooltip can be used with non-element components like text. Keep in mind that this
 * is accomplished by wrapping the text in a `div`, which may lead to unexpected styling behavior.
 */
export const Text: Story = {
  args: {
    description: 'My tooltip has a description!',
    children: 'this text has a tooltip',
  },
  render: (args) => {
    return (
      <div style={{ width: '100px' }}>
        <InfoTooltip {...args} />
      </div>
    );
  },
};
