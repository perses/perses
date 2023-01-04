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

import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import CloseIcon from 'mdi-material-ui/Close';
import { useDiscardChangesConfirmationDialog } from '../../context';

export const DiscardChangesConfirmationDialog = () => {
  const { discardChangesConfirmationDialog: dialog } = useDiscardChangesConfirmationDialog();
  const isOpen = dialog !== undefined;

  return (
    <Dialog open={isOpen}>
      {dialog !== undefined && (
        <>
          <DialogTitle>Discard Changes</DialogTitle>
          <IconButton
            aria-label="Close"
            onClick={dialog.onCancel}
            sx={(theme) => ({
              position: 'absolute',
              top: theme.spacing(0.5),
              right: theme.spacing(0.5),
            })}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent dividers sx={{ width: '500px' }}>
            {dialog.description ||
              'You have unsaved changes in this dashboard. Are you sure you want to discard these changes? Changes cannot be recovered.'}
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={dialog.onDiscardChanges}>
              Discard Changes
            </Button>
            <Button variant="outlined" onClick={dialog.onCancel}>
              Cancel
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};
