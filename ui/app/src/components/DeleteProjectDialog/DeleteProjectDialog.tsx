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

import { DispatchWithoutAction } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton } from '@mui/material';
import CloseIcon from 'mdi-material-ui/Close';

export interface DeleteProjectDialogProps {
  name: string | undefined;
  open: boolean;
  onClose: DispatchWithoutAction;
  onSubmit: DispatchWithoutAction;
}

/**
 * Dialog used to delete a project.
 *
 * @param props.name The name of the project to delete.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.closeDialog Provides the function to close itself.
 * @param props.onConfirm Action to perform when user confirmed.
 * @constructor
 */
const DeleteProjectDialog = (props: DeleteProjectDialogProps) => {
  const { name, open, onClose, onSubmit } = props;

  const handleSubmit = () => {
    onClose();
    onSubmit();
  };
  const handleClose = () => {
    onClose();
  };
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Delete Project</DialogTitle>
      <IconButton
        aria-label="Close"
        onClick={handleClose}
        sx={(theme) => ({
          position: 'absolute',
          top: theme.spacing(0.5),
          right: theme.spacing(0.5),
        })}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers sx={{ width: '500px' }}>
        Are you sure you want to delete the project <strong>{name}</strong>? This will delete all the dashboards within
        the project.
      </DialogContent>
      <DialogActions>
        <Button variant="contained" type="submit" onClick={handleSubmit}>
          Delete
        </Button>
        <Button variant="contained" color="secondary" onClick={handleClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteProjectDialog;
