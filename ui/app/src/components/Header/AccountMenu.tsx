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

import { MouseEvent, ReactElement, useMemo, useState } from 'react';
import {
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Collapse,
  List,
  ListItemButton,
  ListItemText,
  Box,
} from '@mui/material';
import AccountCircle from 'mdi-material-ui/AccountCircle';
import AccountBox from 'mdi-material-ui/AccountBox';
import Logout from 'mdi-material-ui/Logout';
import ExpandLess from 'mdi-material-ui/ChevronUp';
import ExpandMore from 'mdi-material-ui/ChevronDown';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { useActiveUser, useOrganizationList, useUserApi } from '../../model/auth-client';
import { LoginUrl, LogoutUrl, ProfileRoute } from '../../model/route';
import { ThemeSwitch } from './ThemeSwitch';
import { activeOrganization } from '../../constants/auth-token';
import { Typography } from '@mui/material';
import CheckIcon from 'mdi-material-ui/Check';
import { PERSES_APP_CONFIG } from '../../config';
import { HTTPHeader, HTTPMethodGET } from '../../model/http';

export function AccountMenu(): ReactElement {
  const owner = useActiveUser();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openSwitch, setOpenSwitch] = useState(false);
  const [cookies, setCookie] = useCookies([activeOrganization]);
  const { data: user } = useUserApi();
  const { data: orgs } = useOrganizationList(user?.metadata?.name);

  const basePath = PERSES_APP_CONFIG.api_prefix;

  const accounts = useMemo(() => {
    if (!user && !orgs) return [];

    const userAccount = user
      ? [
          {
            ...user,
            user_type: 'user',
          },
        ]
      : [];

    const orgAccounts =
      orgs?.map((org: any) => ({
        ...org,
        user_type: 'org',
      })) ?? [];

    return [...userAccount, ...orgAccounts];
  }, [user, orgs]);

  const handleMenu = (event: MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = (): void => {
    setAnchorEl(null);
  };
  const handleToggleSwitch = (): void => {
    setOpenSwitch(!openSwitch);
  };
  const handleSwitchAccount = (accountId: string): void => {
    setCookie(activeOrganization, accountId, { path: '/' });
    setAnchorEl(null);
    if (pathname !== basePath) {
      navigate('/');
    }
  };

  const handleLogout = async (): Promise<void> => {
    await fetch(LogoutUrl, {
      method: HTTPMethodGET,
      headers: HTTPHeader,
    });
    window.location.href = LoginUrl;
  };

  const currentAccount = accounts.find((acc) => acc.metadata?.name === owner);

  const getAccountTypeLabel = (userType: string) => {
    return userType === 'user' ? 'Personal Account' : 'Organization';
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
          <Box display="flex" flexDirection="column">
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {owner}
            </Typography>
            {currentAccount && (
              <Typography variant="body2" color="text.secondary">
                {getAccountTypeLabel(currentAccount.user_type)}
              </Typography>
            )}
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleToggleSwitch}>
          <ListItemIcon>
            <AccountBox />
          </ListItemIcon>
          Switch Account
          {openSwitch ? <ExpandLess /> : <ExpandMore />}
        </MenuItem>

        <Collapse in={openSwitch} timeout="auto" unmountOnExit>
          <List disablePadding>
            {accounts.map((acc) => (
              <ListItemButton
                key={acc.metadata?.name}
                selected={owner === acc.metadata?.name}
                onClick={() => handleSwitchAccount(acc.metadata?.name)}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <AccountCircle />
                </ListItemIcon>
                <ListItemText primary={acc.metadata?.name} secondary={getAccountTypeLabel(acc.user_type)} />
                {owner === acc.metadata?.name && <CheckIcon color="primary" />}
              </ListItemButton>
            ))}
          </List>
        </Collapse>

        <Divider />
        <ThemeSwitch isAuthEnabled />
        <MenuItem component={RouterLink} to={ProfileRoute}>
          <ListItemIcon>
            <AccountBox />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
