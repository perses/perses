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

import React, { MouseEvent, ReactElement, useState } from 'react';
import { Box, IconButton, ListItemIcon, Menu as MUIMenu, MenuItem, Typography } from '@mui/material';
import Menu from 'mdi-material-ui/Menu';
import { Link as RouterLink } from 'react-router-dom';
import ShieldStar from 'mdi-material-ui/ShieldStar';
import Cog from 'mdi-material-ui/Cog';
import Compass from 'mdi-material-ui/Compass';
import { AdminRoute, ConfigRoute, ExploreRoute } from '../../model/route';
import { GlobalProject, useHasPartialPermission } from '../../context/Authorization';

export function ToolMenu(): ReactElement {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const hasPartialPermission = useHasPartialPermission(['read'], GlobalProject, [
    'GlobalDatasource',
    'GlobalRole',
    'GlobalRoleBinding',
    'GlobalSecret',
    'GlobalVariable',
    'User',
  ]);

  const handleMenu = (event: MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = (): void => {
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
