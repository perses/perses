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

import { ChangeEvent, Dispatch, DispatchWithoutAction, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton } from '@mui/material';
import CloseIcon from 'mdi-material-ui/Close';

export interface AddProjectDialogProps {
  open: boolean;
  onClose: DispatchWithoutAction;
  onSubmit: Dispatch<string>;
}

/**
 * Dialog used to create a project.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.closeDialog Provides the function to close itself.
 * @param props.onConfirm Action to perform when user confirmed.
 * @constructor
 */
const AddProjectDialog = (props: AddProjectDialogProps) => {
  const { open, onClose, onSubmit } = props;
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (!e.target.value) {
      setError('Required');
    } else if (!/^[a-zA-Z0-9_.:-]+$/.exec(e.target.value)) {
      setError('Allowed special characters are _ . : -');
    } else {
      setError('');
    }
  };

  // Reinitialize form for next time the dialog is opened
  const resetForm = () => {
    setName('');
    setError('');
  };
  const handleSubmit = () => {
    onClose();
    onSubmit(name);

    resetForm();
  };
  const handleClose = () => {
    onClose();
    resetForm();
  };
  return (
    <Dialog open={open} onClose={handleClose}>
      <form>
        <DialogTitle>Add Project</DialogTitle>
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
          <TextField
            required
            margin="dense"
            id="name"
            label="Name"
            type="text"
            fullWidth
            onChange={handleChange}
            value={name}
            error={!!error}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" type="submit" disabled={!!error} onClick={handleSubmit}>
            Add
          </Button>
          <Button variant="contained" color="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddProjectDialog;
