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

import { ReactElement, MouseEvent } from 'react';
import {
  Button,
  ButtonProps,
  Dialog as MuiDialog,
  DialogActions,
  DialogContent,
  DialogContentProps as MuiDialogContentProps,
  DialogProps,
  DialogTitle,
  DialogTitleProps,
  IconButton,
  styled,
  Theme,
} from '@mui/material';
import CloseIcon from 'mdi-material-ui/Close';
import { combineSx } from '../utils';

export interface DialogHeaderProps extends DialogTitleProps {
  /**
   * Callback fired when close button is clicked. If undefined, close button will not appear in header.
   */
  onClose?: (e: MouseEvent<HTMLElement>) => void;
}

export type DialogButtonProps = Omit<ButtonProps, 'variant' | 'color' | 'type'>;

export type DialogContentProps = MuiDialogContentProps;

const Header = ({ children, onClose, ...props }: DialogHeaderProps): ReactElement => {
  return (
    <>
      <DialogTitle style={{ textOverflow: 'ellipsis', overflow: 'hidden' }} {...props}>
        {children}
      </DialogTitle>
      {onClose && (
        <IconButton aria-label="Close" onClick={onClose} sx={dialogCloseIconButtonStyle}>
          <CloseIcon />
        </IconButton>
      )}
    </>
  );
};

const Content = ({ children, sx, ...props }: DialogContentProps): ReactElement => (
  <DialogContent dividers {...props} sx={combineSx({ minWidth: `500px`, textWrap: 'balance' }, sx)}>
    {children}
  </DialogContent>
);

const PrimaryButton = ({ children, ...props }: DialogButtonProps): ReactElement => (
  <Button variant="contained" type="submit" {...props}>
    {children}
  </Button>
);

const SecondaryButton = ({ children, ...props }: DialogButtonProps): ReactElement => (
  <Button variant="outlined" color="secondary" {...props}>
    {children}
  </Button>
);

/*
 * Material-ui has a prop "scroll=paper" that is specifically for dialog header and actions to be sticky and body to scroll,
 * but that doesn't work when dialog content is wrapped in form.
 * https://github.com/mui-org/material-ui/issues/13253
 * This component adds style to get expected behavior & should be used whenever we have a Form inside a Dialog
 */
const Form = styled('form')({
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
});

/**
 * Render the CSS of the dialog's close button, according to the given material theme.
 * @param theme material theme
 */
const dialogCloseIconButtonStyle = (theme: Theme): Record<string, unknown> => {
  return { position: 'absolute', top: theme.spacing(0.5), right: theme.spacing(0.5) };
};

export const Dialog = ({ children, ...props }: DialogProps): ReactElement => (
  <MuiDialog {...props}>{children}</MuiDialog>
);

Dialog.Header = Header;
Dialog.Form = Form;
Dialog.Content = Content;
Dialog.PrimaryButton = PrimaryButton;
Dialog.SecondaryButton = SecondaryButton;
Dialog.Actions = DialogActions;
