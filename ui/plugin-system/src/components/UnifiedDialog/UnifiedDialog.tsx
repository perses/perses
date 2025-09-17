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

import { Button, Dialog, DialogActions, DialogContent, DialogProps, DialogTitle } from '@mui/material';
import { ReactElement, useMemo } from 'react';

/* Please pick the desired props as you go along */
export interface UnifiedDialogProps extends Pick<DialogProps, 'open' | 'PaperProps' | 'fullWidth' | 'maxWidth'> {
  title: string;
  setOpenDialog: (value: boolean) => void;
  children: ReactElement;
}

export const UnifiedDialog = (props: UnifiedDialogProps): ReactElement => {
  const { children, setOpenDialog, title, PaperProps, ...rest } = props;
  const memoizedPaperProps = useMemo(() => {
    return (
      PaperProps || {
        sx: {
          margin: '10px',
          width: 'calc(100% - 20px)',
        },
      }
    );
  }, [PaperProps]);

  return (
    <Dialog PaperProps={memoizedPaperProps} {...rest}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={() => {
            setOpenDialog(false);
          }}
          color="primary"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
