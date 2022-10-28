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

import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import CloseIcon from 'mdi-material-ui/Close';
export interface UnsavedChangesConfirmationDialogProps {
  open: boolean;
}

export const UnsavedChangesConfirmationDialog = (props: UnsavedChangesConfirmationDialogProps) => {
  return (
    <Dialog open={props.open}>
      <DialogTitle>Unsaved Changes</DialogTitle>
      <IconButton
        aria-label="Close"
        // onClick={() => closeDeletePanelDialog()}
        sx={(theme) => ({
          position: 'absolute',
          top: theme.spacing(0.5),
          right: theme.spacing(0.5),
        })}
      >
        <CloseIcon />
      </IconButton>
      <form onSubmit={}>
        <DialogContent sx={{ width: '500px' }}>
          You have unsaved changes in this dashboard. Would you like to save these changes?
        </DialogContent>
        <DialogActions>
          <Button variant="contained" type="submit">
            Save
          </Button>
          <Button>Cancel</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
