// Copyright 2024 The Perses Authors
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

import { Button, ButtonGroup, ClickAwayListener, Grow, MenuList, Paper, Popper } from '@mui/material';
import { useState, MouseEvent, ReactElement } from 'react';
import MenuDown from 'mdi-material-ui/MenuDown';

export interface ButtonMenuProps {
  children: JSX.Element[];
}

/**
 * ButtonMenu is a button with a drop down menu for more actions.
 * The first child is the button, the other are the menu entries.
 **/
const ButtonMenu = ({ children }: ButtonMenuProps): ReactElement => {
  const primary = children[0];
  const menuEntries = children.slice(1);

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = (event: MouseEvent<HTMLElement>): void => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <ButtonGroup variant="contained" aria-label="split button">
        {primary}
        <Button size="small" aria-expanded={open ? 'true' : undefined} aria-haspopup="menu" onClick={handleClick}>
          <MenuDown />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{
          zIndex: 1,
        }}
        open={open}
        anchorEl={anchorEl}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {menuEntries}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};

export default ButtonMenu;
