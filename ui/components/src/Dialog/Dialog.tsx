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

import React from 'react';
import {
  Button,
  Dialog as MuiDialog,
  DialogActions,
  DialogContent,
  DialogContentProps as MuiDialogContentProps,
  DialogTitle,
  DialogTitleProps,
  IconButton,
} from '@mui/material';
import CloseIcon from 'mdi-material-ui/Close';
import { combineSx } from '../utils';

export interface DialogHeaderProps extends DialogTitleProps {
  /**
   * Callback fired when close button is clicked. If undefined, close button will not appear in header.
   */
  onClose?: (e: React.MouseEvent<HTMLElement>) => void;
}

export interface DialogButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  /**
   * This specifies the form the button belongs to.
   * The value of this prop must be equal to the id attribute of a form element.
   */
  form?: string;
}

export interface DialogContentProps extends MuiDialogContentProps {
  /**
   * @default 500
   */
  width?: number;
}

const Header = ({ children, onClose, ...props }: DialogHeaderProps) => {
  return (
    <>
      <DialogTitle {...props}>{children}</DialogTitle>
      {onClose && (
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
      )}
    </>
  );
};

const Content = ({ children, width = 500, sx, ...props }: DialogContentProps) => (
  <DialogContent dividers {...props} sx={combineSx({ width: `${width}px` }, sx)}>
    {children}
  </DialogContent>
);

const PrimaryButton = ({ children, form, onClick }: DialogButtonProps) => (
  <Button variant="contained" type="submit" form={form} onClick={onClick}>
    {children}
  </Button>
);

const SecondaryButton = ({ children, onClick }: DialogButtonProps) => (
  <Button variant="outlined" color="secondary" onClick={onClick}>
    {children}
  </Button>
);

export const Dialog = {
  Dialog: MuiDialog,
  Header,
  Content,
  PrimaryButton,
  SecondaryButton,
  Actions: DialogActions,
};
