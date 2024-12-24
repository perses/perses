// Copyright 2025 The Perses Authors
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
import { AppBar, Box, Button, Divider, Toolbar } from '@mui/material';
import Cog from 'mdi-material-ui/Cog';
import ShieldStar from 'mdi-material-ui/ShieldStar';
import Compass from 'mdi-material-ui/Compass';
import React from 'react';
import { useListPluginMetadata, usePlugins } from '@perses-dev/plugin-system';
import { useIsLaptopSize, useIsMobileSize } from '../../utils/browser-size';
import { AdminRoute, ConfigRoute } from '../../model/route';
import { useIsAuthEnabled, useIsExplorerEnabled } from '../../context/Config';
import { GlobalProject, useHasPartialPermission } from '../../context/Authorization';
import WhitePersesLogo from '../logo/WhitePersesLogo';
import PersesLogoCropped from '../logo/PersesLogoCropped';
import { ToolMenu } from './ToolMenu';
import { AccountMenu } from './AccountMenu';
import { ThemeSwitch } from './ThemeSwitch';
import { SearchBar } from './SearchBar/SearchBar';

export default function Header(): JSX.Element {
  const isLaptopSize = useIsLaptopSize();
  const isMobileSize = useIsMobileSize();
  const isAuthEnabled = useIsAuthEnabled();
  const IsExplorerEnabled = useIsExplorerEnabled();

  const hasPartialPermission = useHasPartialPermission(['read'], GlobalProject, [
    'GlobalDatasource',
    'GlobalRole',
    'GlobalRoleBinding',
    'GlobalSecret',
    'GlobalVariable',
    'User',
  ]);

  // Collect all the available plugins of type "NavBar"
  const { data: navBarPluginsMetadata } = useListPluginMetadata(['Navbar']);
  const navbarPlugins = usePlugins('Navbar', navBarPluginsMetadata ?? []);

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
            alignItems: 'center',
            width: '100%',
            flexShrink: isMobileSize ? 2 : 1,
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
              {IsExplorerEnabled && (
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
              )}
            </>
          ) : (
            <ToolMenu />
          )}
        </Box>
        <SearchBar />
        <Box
          sx={{
            width: '100%',
            flexShrink: isMobileSize ? 2 : 1,
            display: 'flex',
            justifyContent: 'end',
          }}
        >
          {navbarPlugins.map((plugin, i) => plugin.data && <plugin.data.Component key={`${i}`} />)}

          {isAuthEnabled ? <AccountMenu /> : <ThemeSwitch isAuthEnabled={false} />}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
