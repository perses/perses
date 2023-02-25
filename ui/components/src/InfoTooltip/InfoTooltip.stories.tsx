import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@mui/material';
import { InfoTooltip } from './InfoTooltip';

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
