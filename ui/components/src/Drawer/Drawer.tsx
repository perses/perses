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

import { Drawer as MuiDrawer } from '@mui/material';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  anchor?: 'left' | 'right';
  children?: React.ReactNode;
}

const DRAWER_DEFAULT_WIDTH = 900;

export const Drawer = ({ anchor = 'right', isOpen, onClose, children }: DrawerProps) => {
  return (
    <MuiDrawer
      open={isOpen}
      onClose={onClose}
      anchor={anchor}
      PaperProps={{
        sx: {
          width: `${DRAWER_DEFAULT_WIDTH}px`,
          padding: (theme) => theme.spacing(2),
          overflow: 'hidden',
        },
      }}
    >
      {children}
    </MuiDrawer>
  );
};
