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

import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import CloseIcon from 'mdi-material-ui/Close';
export interface UnsavedChangesConfirmationDialogProps {
  isOpen: boolean;
  onSave: () => void;
  onClose: () => void;
}

export const UnsavedChangesConfirmationDialog = ({
  isOpen,
  onSave,
  onClose,
}: UnsavedChangesConfirmationDialogProps) => {
  return (
    <Dialog open={isOpen}>
      <DialogTitle>Unsaved Changes</DialogTitle>
      <IconButton
        aria-label="Close"
        onClick={onClose}
        sx={(theme) => ({
          position: 'absolute',
          top: theme.spacing(0.5),
          right: theme.spacing(0.5),
        })}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent sx={{ width: '500px' }}>
        You have unsaved changes in this dashboard. Would you like to save these changes?
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onSave}>
          Save
        </Button>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
