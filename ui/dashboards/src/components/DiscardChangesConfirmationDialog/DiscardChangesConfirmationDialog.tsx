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

import { Button } from '@mui/material';
import { Dialog } from '@perses-dev/components';
import { useDiscardChangesConfirmationDialog } from '../../context';

interface DiscardChangesConfirmationDialogProps {
  description: string;
  isOpen: boolean;
  onCancel: () => void;
  onDiscardChanges: () => void;
}

export const DiscardChangesConfirmationDialog = (props: DiscardChangesConfirmationDialogProps) => {
  const { description, isOpen, onCancel, onDiscardChanges } = props;

  return (
    <Dialog open={isOpen} aria-labelledby="discard-dialog">
      <Dialog.Header>Discard Changes</Dialog.Header>
      <Dialog.Content>{description}</Dialog.Content>
      <Dialog.Actions>
        <Button variant="contained" onClick={onDiscardChanges}>
          Discard Changes
        </Button>
        <Button variant="outlined" color="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

export const DashboardDiscardChangesConfirmationDialog = () => {
  const { discardChangesConfirmationDialog: dialog } = useDiscardChangesConfirmationDialog();

  if (dialog) {
    return (
      <DiscardChangesConfirmationDialog
        description={
          dialog.description ||
          'You have unsaved changes in this dashboard. Are you sure you want to discard these changes? Changes cannot be recovered.'
        }
        isOpen={true}
        onCancel={dialog.onCancel}
        onDiscardChanges={dialog.onDiscardChanges}
      />
    );
  }

  return <></>;
};
