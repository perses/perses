// Copyright 2021 The Perses Authors
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

import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Menu,
  MenuItem,
  Switch,
  Theme,
  Toolbar,
  Typography,
} from '@mui/material';
import { ChevronDown } from 'mdi-material-ui';
import { SxProps } from '@mui/system/styleFunctionSx/styleFunctionSx';
import { MouseEvent, useState } from 'react';
import { ProjectModel, useProjectQuery } from '../model/project-client';
import Toast from './Toast';

function ProjectMenu(props: { projectList: ProjectModel[] }): JSX.Element {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  return (
    <>
      <Button
        aria-label="list of the available project"
        aria-controls="menu-project-list-appbar"
        aria-haspopup="true"
        color="inherit"
        endIcon={<ChevronDown />}
        onClick={handleMenu}
      >
        Projects
      </Button>
      <Menu
        id="menu-project-list-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        {props.projectList.map((value, index) => {
          return (
            // TODO when routing is in place, use the button to redirect to the project page
            <MenuItem key={index} onClick={handleCloseMenu}>
              {value.metadata.name}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

const style: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'row',
};

export default function Header(): JSX.Element {
  const { response, loading, error } = useProjectQuery();
  return (
    <AppBar position="relative">
      <Toolbar>
        <Box sx={style} flexGrow={1}>
          <Typography variant="h6" sx={{ marginRight: '1rem' }}>
            Perses
          </Typography>
          <Divider
            orientation="vertical"
            flexItem
            sx={{ borderRightColor: 'rgba(255,255,255,0.2)' }}
          />
          {loading ? (
            <CircularProgress size="1rem" />
          ) : (
            response && <ProjectMenu projectList={response} />
          )}
        </Box>
        <Switch />
      </Toolbar>
      {/* TODO manage in a single place the pull of fetching error */}
      <Toast loading={loading} severity={'error'} message={error?.message} />
    </AppBar>
  );
}
