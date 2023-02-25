import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@mui/material';
import { action } from '@storybook/addon-actions';
import { Drawer } from '@perses-dev/components';

const meta: Meta<typeof Drawer> = {
  component: Drawer,
  render: (args) => <DrawerWithButton {...args} />,
};

export default meta;

type Story = StoryObj<typeof Drawer>;

const DrawerWithButton = (args: Story['args']) => {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    action('onClose')();
    setOpen(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outlined">
        open drawer
      </Button>
      <Drawer {...args} isOpen={open} onClose={handleClose}>
        Drawer content
      </Drawer>
    </>
  );
};

export const Primary: Story = {
  args: {},
};
