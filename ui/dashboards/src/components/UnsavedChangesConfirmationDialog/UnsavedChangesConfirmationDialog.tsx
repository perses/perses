/* eslint-disable @typescript-eslint/no-empty-function */

// Copyright 2022 The Perses Authors
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

import { Dialog, DialogButtonProps } from '@perses-dev/components';

export interface UnsavedChangesConfirmationDialogProps {
  isOpen: boolean;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

export const UnsavedChangesConfirmationDialog = ({
  isOpen,
  onSave,
  onCancel,
}: UnsavedChangesConfirmationDialogProps) => {
  const saveButtonProps: DialogButtonProps = {
    name: 'Save',
    onClick: onSave,
  };

  const cancelButtonProps: DialogButtonProps = {
    name: 'Cancel',
    onClick: onCancel,
  };

  return (
    <Dialog
      isOpen={isOpen}
      title="Unsaved Changes"
      primaryButton={saveButtonProps}
      secondaryButton={cancelButtonProps}
      onClose={onCancel}
    >
      You have unsaved changes in this dashboard. Would you like to save these changes?
    </Dialog>
  );
};
