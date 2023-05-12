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

import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Typography,
} from '@mui/material';
import CloseIcon from 'mdi-material-ui/Close';
import { useSaveChangesConfirmationDialog } from '../../context';

export const SaveChangesConfirmationDialog = () => {
  // const { discardChangesConfirmationDialog: dialog } = useDiscardChangesConfirmationDialog();

  const { saveChangesConfirmationDialog: dialog } = useSaveChangesConfirmationDialog();
  const isOpen = dialog !== undefined;

  // closeSaveChangesConfirmationDialog () { set((state)=> {…}
  // openSaveChangesConfirmationDialog (dialog) { set((state)=> {…}
  // saveChangesConfirmationDialog

  return (
    <Dialog open={isOpen}>
      {dialog !== undefined && (
        <>
          <DialogTitle>Save Changes</DialogTitle>
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
            <Typography marginBottom={2}>
              {dialog.description ||
                'It seems like you have made some changes to the dashboard, including the time period or variable values. Would you like to save these?'}
            </Typography>

            <FormGroup>
              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label="Save current time period as new default (Absolute time ranges can not be saved)"
              />
              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label="Save current variables values as new default"
              />
            </FormGroup>
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={dialog.onSaveChanges}>
              Save Changes
            </Button>
            <Button variant="outlined" color="secondary" onClick={dialog.onCancel}>
              Cancel
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};
