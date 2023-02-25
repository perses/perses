import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@mui/material';
import { action } from '@storybook/addon-actions';
import { Dialog } from '@perses-dev/components';

const meta: Meta<typeof Dialog> = {
  component: Dialog,
  render: (args) => {
    return <DialogWithButton {...args} />;
  },
};

export default meta;

type Story = StoryObj<typeof Dialog>;

const DialogWithButton = (args: Story['args']) => {
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    action('clicked dialog submit button')();
    setOpen(false);
  };

  const handleCancel = () => {
    action('clicked dialog cancel button')();
    setOpen(false);
  };

  const handleClose = () => {
    action('onClose')();
    setOpen(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outlined">
        open dialog
      </Button>
      <Dialog {...args} open={open} onClose={handleClose}>
        <Dialog.Header>Dialog header</Dialog.Header>
        <Dialog.Content>Dialog content</Dialog.Content>
        <Dialog.Actions>
          <Button variant="contained" type="submit" onClick={handleSubmit}>
            Submit
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        </Dialog.Actions>
      </Dialog>
    </>
  );
};

export const Primary: Story = {
  args: {},
};
