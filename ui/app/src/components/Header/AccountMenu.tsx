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

import { MouseEvent, ReactElement, useState } from 'react';
import { Divider, IconButton, ListItemIcon, Menu, MenuItem } from '@mui/material';
import AccountCircle from 'mdi-material-ui/AccountCircle';
import AccountBox from 'mdi-material-ui/AccountBox';
import Logout from 'mdi-material-ui/Logout';
import { Link as RouterLink } from 'react-router-dom';
import { useAuthToken } from '../../model/auth-client';
import { ProfileRoute } from '../../model/route';
import { ThemeSwitch } from './ThemeSwitch';

export function AccountMenu(): ReactElement {
  const { data: decodedToken } = useAuthToken();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = (): void => {
    setAnchorEl(null);
  };
  return (
    <>
      <IconButton
        aria-label="Account menu"
        aria-controls="menu-account-list-appbar"
        aria-haspopup="true"
        color="inherit"
        onClick={handleMenu}
      >
        <AccountCircle />
      </IconButton>
      <Menu
        id="menu-account-list-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        keepMounted
        open={anchorEl !== null}
        onClose={handleCloseMenu}
      >
        <MenuItem>
          <ListItemIcon>
            <AccountCircle />
          </ListItemIcon>
          {decodedToken?.sub}
        </MenuItem>
        <Divider />
        <ThemeSwitch isAuthEnabled />
        <MenuItem component={RouterLink} to={ProfileRoute}>
          <ListItemIcon>
            <AccountBox />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem component="a" href="/api/auth/logout">
          <ListItemIcon>
            <Logout />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
