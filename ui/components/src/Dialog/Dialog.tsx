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

import { IconButton, Dialog as MuiDialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import CloseIcon from 'mdi-material-ui/Close';

export interface DialogProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  primaryButton: DialogButtonProps;
  secondaryButton: DialogButtonProps;
  children: React.ReactNode;
}

export interface DialogButtonProps {
  name: string;
  onClick: () => void;
}

const DIALOG_DEFAULT_WIDTH = 500;

export const Dialog = ({ isOpen, title, children, onClose, primaryButton, secondaryButton }: DialogProps) => {
  return (
    <MuiDialog open={isOpen}>
      <DialogTitle>{title}</DialogTitle>
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
      <form onSubmit={primaryButton.onClick}>
        <DialogContent sx={{ width: DIALOG_DEFAULT_WIDTH }}>{children}</DialogContent>
        <DialogActions>
          <Button variant="contained" type="submit">
            {primaryButton.name}
          </Button>
          <Button onClick={secondaryButton.onClick}>{secondaryButton.name}</Button>
        </DialogActions>
      </form>
    </MuiDialog>
  );
};
