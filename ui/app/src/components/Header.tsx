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

import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  ListItemIcon,
  Menu as MUIMenu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import ChevronDown from 'mdi-material-ui/ChevronDown';
import Cog from 'mdi-material-ui/Cog';
import Archive from 'mdi-material-ui/Archive';
import ShieldStar from 'mdi-material-ui/ShieldStar';
import Menu from 'mdi-material-ui/Menu';
import Compass from 'mdi-material-ui/Compass';
import AccountCircle from 'mdi-material-ui/AccountCircle';
import Logout from 'mdi-material-ui/Logout';
import Brightness4 from 'mdi-material-ui/Brightness4';
import Brightness5 from 'mdi-material-ui/Brightness5';
import React, { MouseEvent, useState } from 'react';
import { useSnackbar } from '@perses-dev/components';
import { getResourceDisplayName } from '@perses-dev/core';
import { useProjectList } from '../model/project-client';
import { useDarkMode } from '../context/DarkMode';
import { useIsLaptopSize, useIsMobileSize } from '../utils/browser-size';
import { AdminRoute, ConfigRoute, ExploreRoute } from '../model/route';
import { useIsAuthEnabled } from '../context/Config';
import { useAuthToken } from '../model/auth-client';
import { GlobalProject, useHasPartialPermission } from '../context/Authorization';
import WhitePersesLogo from './logo/WhitePersesLogo';
import PersesLogoCropped from './logo/PersesLogoCropped';

const ITEM_HEIGHT = 48;

function ThemeSwitch(props: { isAuthEnabled: boolean }) {
  const { isDarkModeEnabled, setDarkMode } = useDarkMode();
  const { exceptionSnackbar } = useSnackbar();
  const handleDarkModeChange = () => {
    try {
      setDarkMode(!isDarkModeEnabled);
    } catch (e) {
      exceptionSnackbar(e);
    }
  };
  const swapIcon = () => {
    return isDarkModeEnabled ? <Brightness5 id="dark" /> : <Brightness4 id="light" />;
  };
  if (props.isAuthEnabled) {
    return (
      <MenuItem onClick={handleDarkModeChange}>
        <ListItemIcon>{swapIcon()}</ListItemIcon>
        Switch Theme
      </MenuItem>
    );
  }
  return (
    <Tooltip title="Switch Theme">
      <IconButton onClick={handleDarkModeChange} aria-label="Theme" style={{ color: 'white' }}>
        {swapIcon()}
      </IconButton>
    </Tooltip>
  );
}

function AccountMenu() {
  const { data: decodedToken } = useAuthToken();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  return (
    <Box>
      <IconButton
        aria-label="Account menu"
        aria-controls="menu-account-list-appbar"
        aria-haspopup="true"
        color="inherit"
        onClick={handleMenu}
      >
        <AccountCircle />
      </IconButton>
      <MUIMenu
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
        <MenuItem component="a" href={'/api/auth/logout'}>
          <ListItemIcon>
            <Logout />
          </ListItemIcon>
          Logout
        </MenuItem>
      </MUIMenu>
    </Box>
  );
}

function ToolMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const hasPartialPermission = useHasPartialPermission(['read'], GlobalProject, [
    'GlobalDatasource',
    'GlobalRole',
    'GlobalRoleBinding',
    'GlobalSecret',
    'GlobalVariable',
    'User',
  ]);

  const handleMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  return (
    <Box>
      <IconButton
        aria-label="Tooling menu"
        aria-controls="menu-tool-list-appbar"
        aria-haspopup="true"
        color="inherit"
        onClick={handleMenu}
      >
        <Menu />
      </IconButton>
      <MUIMenu
        id="menu-tool-list-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        keepMounted
        open={anchorEl !== null}
        onClose={handleCloseMenu}
        onClick={handleCloseMenu}
      >
        {hasPartialPermission && (
          <MenuItem component={RouterLink} to={AdminRoute}>
            <ListItemIcon>
              <ShieldStar />
            </ListItemIcon>
            <Typography>Admin</Typography>
          </MenuItem>
        )}
        <MenuItem component={RouterLink} to={ConfigRoute}>
          <ListItemIcon>
            <Cog />
          </ListItemIcon>
          <Typography>Config</Typography>
        </MenuItem>
        <MenuItem component={RouterLink} to={ExploreRoute}>
          <ListItemIcon>
            <Compass />
          </ListItemIcon>
          <Typography>Explore</Typography>
        </MenuItem>
      </MUIMenu>
    </Box>
  );
}

function ProjectMenu(): JSX.Element {
  const { exceptionSnackbar } = useSnackbar();
  const { data, isLoading } = useProjectList({ onError: exceptionSnackbar });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  if (isLoading) {
    return <CircularProgress size="1rem" />;
  }

  return (
    <Box>
      <Button
        aria-label="List of the available projects"
        aria-controls="menu-project-list-appbar"
        aria-haspopup="true"
        color="inherit"
        onClick={handleMenu}
      >
        <Archive sx={{ marginRight: 0.5 }} />
        Projects
        <ChevronDown />
      </Button>
      <MUIMenu
        id="menu-project-list-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        keepMounted
        open={anchorEl !== null}
        onClose={handleCloseMenu}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5,
            width: '10em',
          },
        }}
      >
        {(data ?? []).length > 0 ? (
          (data ?? []).map((project, index) => {
            return (
              <li key={index}>
                <MenuItem
                  component={RouterLink}
                  to={`/projects/${project.metadata.name}`}
                  onClick={() => {
                    setAnchorEl(null);
                  }}
                >
                  <Typography
                    variant="inherit"
                    noWrap
                    sx={{
                      '&:hover': {
                        overflow: 'visible',
                      },
                    }}
                  >
                    {getResourceDisplayName(project)}
                  </Typography>
                </MenuItem>
              </li>
            );
          })
        ) : (
          <MenuItem key="empty">
            <Typography
              sx={{
                fontStyle: 'italic',
              }}
            >
              Empty
            </Typography>
          </MenuItem>
        )}
      </MUIMenu>
    </Box>
  );
}

export default function Header(): JSX.Element {
  const isLaptopSize = useIsLaptopSize();
  const isMobileSize = useIsMobileSize();
  const isAuthEnabled = useIsAuthEnabled();

  const hasPartialPermission = useHasPartialPermission(['read'], GlobalProject, [
    'GlobalDatasource',
    'GlobalRole',
    'GlobalRoleBinding',
    'GlobalSecret',
    'GlobalVariable',
    'User',
  ]);

  return (
    <AppBar position="relative">
      <Toolbar
        sx={{
          backgroundColor: (theme) => theme.palette.designSystem.blue[700],
          '&': {
            minHeight: '40px',
            paddingLeft: 0,
            paddingRight: 0.75,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            flexGrow: 1,
            alignItems: 'center',
          }}
        >
          <Button
            component={RouterLink}
            to="/"
            sx={{
              padding: 0,
            }}
          >
            {isLaptopSize ? <WhitePersesLogo /> : <PersesLogoCropped color="white" width={32} height={32} />}
          </Button>
          <Divider
            orientation="vertical"
            flexItem
            sx={{ borderRightColor: 'rgba(255,255,255,0.2)', marginRight: 0.5 }}
          />
          {!isMobileSize ? (
            <>
              {hasPartialPermission && (
                <Button
                  aria-label="Administration"
                  aria-controls="menu-admin-appbar"
                  aria-haspopup="true"
                  color="inherit"
                  component={RouterLink}
                  to={AdminRoute}
                >
                  <ShieldStar sx={{ marginRight: 0.5 }} /> Admin
                </Button>
              )}
              <Button
                aria-label="Config"
                aria-controls="menu-config-appbar"
                aria-haspopup="true"
                color="inherit"
                component={RouterLink}
                to={ConfigRoute}
              >
                <Cog sx={{ marginRight: 0.5 }} /> Config
              </Button>
              <Button
                aria-label="Explore"
                aria-controls="menu-config-appbar"
                aria-haspopup="true"
                color="inherit"
                component={RouterLink}
                to="/explore"
              >
                <Compass sx={{ marginRight: 0.5 }} /> Explore
              </Button>
            </>
          ) : (
            <ToolMenu />
          )}
          <ProjectMenu />
        </Box>
        <Stack direction={'row'} alignItems={'center'}>
          {isAuthEnabled ? <AccountMenu /> : <ThemeSwitch isAuthEnabled={false} />}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
