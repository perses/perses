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

import { Drawer as MuiDrawer, DrawerProps as MuiDrawerProps } from '@mui/material';
import { combineSx } from '../utils';

export interface DrawerProps extends MuiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  anchor?: 'left' | 'right';
}

const DRAWER_DEFAULT_WIDTH = 900;

/**
 * Drawer provides supplementary content that are anchored to the left or right edge of the screen.
 */
export const Drawer = ({ anchor = 'right', isOpen, onClose, PaperProps, children, ...rest }: DrawerProps) => {
  return (
    <MuiDrawer
      {...rest}
      open={isOpen}
      onClose={onClose}
      anchor={anchor}
      PaperProps={{
        ...PaperProps,
        sx: combineSx(
          {
            width: `${DRAWER_DEFAULT_WIDTH}px`,
            overflow: 'hidden',
          },
          PaperProps?.sx
        ),
      }}
    >
      {children}
    </MuiDrawer>
  );
};
