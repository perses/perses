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

import { DiscardChangesConfirmationDialog } from '@perses-dev/components';
import { ReactElement } from 'react';
import { useDiscardChangesConfirmationDialog } from '../../context';

export const DashboardDiscardChangesConfirmationDialog = (): ReactElement | null => {
  const { discardChangesConfirmationDialog: dialog } = useDiscardChangesConfirmationDialog();
  if (dialog === undefined) {
    return null;
  }
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
};
