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
import { Button } from '@mui/material';
import { InfoTooltip } from '@perses-dev/components';

const meta: Meta<typeof InfoTooltip> = {
  component: InfoTooltip,
  render: (args) => <TooltipWithTarget {...args} />,
};

export default meta;

type Story = StoryObj<typeof InfoTooltip>;

const TooltipWithTarget = (args: Story['args']) => {
  return (
    <div>
      <InfoTooltip description="fallback description" {...args}>
        <Button variant="outlined">target</Button>
      </InfoTooltip>
    </div>
  );
};

/**
 * The tooltip placement does not work as expected here. Need to dig into why.
 * A vanilla MUI tooltip behaves as expected, so I think it's something with our
 * implementation details.
 */
export const Primary: Story = {
  args: {
    description: 'Tooltip description',
  },
};
