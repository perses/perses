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

import { Drawer as MuiDrawer, DrawerProps as MuiDrawerProps, useMediaQuery } from '@mui/material';
import { combineSx } from '../utils';

export interface DrawerProps extends MuiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  anchor?: 'left' | 'right';
}

const DRAWER_DEFAULT_WIDTH = 1080;

export const Drawer = ({ anchor = 'right', isOpen, onClose, PaperProps, children, ...rest }: DrawerProps) => {
  const isSmaller = useMediaQuery(`(max-width:${DRAWER_DEFAULT_WIDTH}px)`);

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
            width: isSmaller ? '100%' : `${DRAWER_DEFAULT_WIDTH}px`,
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
