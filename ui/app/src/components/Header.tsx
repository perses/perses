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

import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Switch,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import ChevronDown from 'mdi-material-ui/ChevronDown';
import AutoFix from 'mdi-material-ui/AutoFix';
import { MouseEvent, useState } from 'react';
import { useProjectList } from '../model/project-client';
import { useSnackbar } from '../context/SnackbarProvider';
import { useDarkMode } from '../context/DarkMode';
import { PersesLogo } from './PersesLogo';

const ITEM_HEIGHT = 48;

function ProjectMenu(): JSX.Element {
  const navigate = useNavigate();
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

  if (data === undefined || data === null) {
    return <></>;
  }

  return (
    <Box sx={{ padding: (theme) => theme.spacing(0.5, 0, 0, 1) }}>
      <Button
        aria-label="List of the available projects"
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
        open={anchorEl !== null}
        onClose={handleCloseMenu}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5,
            width: '10em',
          },
        }}
      >
        {data.length ? (
          data.map((project, index) => {
            return (
              <MenuItem
                key={index}
                onClick={() => {
                  setAnchorEl(null);
                  navigate(`/projects/${project.metadata.name}`);
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
                  {project.metadata.name}
                </Typography>
              </MenuItem>
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
      </Menu>
    </Box>
  );
}

export default function Header(): JSX.Element {
  const navigate = useNavigate();
  const { exceptionSnackbar } = useSnackbar();
  const { isDarkModeEnabled, setDarkMode } = useDarkMode();
  const handleDarkModeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      await setDarkMode(e.target.checked);
    } catch (e) {
      exceptionSnackbar(e);
    }
  };

  return (
    <AppBar position="relative">
      <Toolbar
        sx={{
          backgroundColor: (theme) => theme.palette.designSystem.blue[700],
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
            onClick={() => {
              navigate('/');
            }}
          >
            <PersesLogo />
          </Button>
          <Divider orientation="vertical" flexItem sx={{ borderRightColor: 'rgba(255,255,255,0.2)' }} />
          <ProjectMenu />
        </Box>
        <Stack direction={'row'} alignItems={'center'}>
          <Tooltip title="Migration tool">
            <IconButton
              sx={(theme) => ({
                color: theme.palette.common.white,
              })}
              onClick={() => {
                navigate('/migrate');
              }}
            >
              <AutoFix />
            </IconButton>
          </Tooltip>
          <Tooltip title="Theme">
            <Switch
              checked={isDarkModeEnabled}
              onChange={handleDarkModeChange}
              inputProps={{ 'aria-label': 'Theme' }}
            />
          </Tooltip>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
