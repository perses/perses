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

import {
  MenuItem,
  Box,
  Paper,
  ListItemText,
  Typography,
  MenuList,
  Input,
  InputAdornment,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import EarthIcon from 'mdi-material-ui/Earth';
import MagnifyIcon from 'mdi-material-ui/Magnify';
import { ChangeEvent, ReactElement, useState } from 'react';
import { ToolbarIconButton } from '../ToolbarIconButton';
import { InfoTooltip } from '../InfoTooltip';
import { getTimeZoneOffset, TimeZoneOption } from '../model/timeZoneOption';

export interface TimeZoneSelectorProps {
  heightPx?: string;
  timeZoneOptions: TimeZoneOption[];
  value: string;
  onChange?: (timeZone: TimeZoneOption) => void;
}

export function TimeZoneSelector({
  heightPx = '34px',
  timeZoneOptions: defaultTimeZoneOptions,
  onChange,
  value = 'local',
}: TimeZoneSelectorProps): ReactElement {
  const isMobile = useMediaQuery(useTheme().breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [searchValue, setSearchValue] = useState('');

  const [timeZoneOptions, setTimeZoneOptions] = useState(defaultTimeZoneOptions);

  function handleSearchChange(event: ChangeEvent<HTMLInputElement>): void {
    setSearchValue(event.target.value);
    if (event.target.value === '') {
      setTimeZoneOptions(defaultTimeZoneOptions);
    } else {
      setTimeZoneOptions(
        defaultTimeZoneOptions.filter((option) => option.label.toLowerCase().includes(event.target.value.toLowerCase()))
      );
    }
  }

  function handleTimeZoneSelection(timeZone: TimeZoneOption): void {
    setOpen(false);
    setTimeZoneOptions(defaultTimeZoneOptions);
    setSearchValue('');
    onChange?.(timeZone);
  }

  function handleOnClickAway(): void {
    setOpen(false);
    setSearchValue('');
    setTimeZoneOptions(defaultTimeZoneOptions);
  }

  return (
    <ClickAwayListener onClickAway={handleOnClickAway}>
      <Box>
        <Box sx={{ position: 'relative' }}>
          <InfoTooltip description={value === 'local' ? localTimeZone : value}>
            <ToolbarIconButton
              data-testid="current-timezone"
              aria-label="Timezone"
              onClick={() => setOpen(!open)}
              sx={(theme) => ({
                height: heightPx,
                paddingLeft: isMobile ? 0 : theme.spacing(1),
                // Hide the timezone text on mobile
                '& .timezone-text': {
                  display: isMobile ? 'none' : 'inline',
                },
              })}
            >
              <span className="timezone-text">
                {value === 'local' ? getTimeZoneOffset(localTimeZone)?.value : getTimeZoneOffset(value)?.value}
              </span>
              <EarthIcon sx={(theme) => ({ marginLeft: theme.spacing(0.5) })} />
            </ToolbarIconButton>
          </InfoTooltip>
        </Box>
        <Paper
          sx={(theme) => ({
            width: 350,
            height: 355,
            position: 'absolute',
            top: isMobile ? 160 : 110,
            right: 10,
            zIndex: 1,
            boxShadow: 3,
            backgroundColor: theme.palette.background.paper,
            display: open ? 'block' : 'none',
          })}
        >
          <Input
            data-testid="search-timezone"
            sx={(theme) => ({
              height: 45,
              padding: theme.spacing(1),
            })}
            value={searchValue}
            fullWidth
            placeholder="Search timezone"
            startAdornment={
              <InputAdornment position="start">
                <MagnifyIcon />
              </InputAdornment>
            }
            onChange={handleSearchChange}
          />
          <MenuList sx={{ height: 305, overflowX: 'auto' }}>
            {timeZoneOptions.map((timeZoneOption) => (
              <Box key={timeZoneOption.value}>
                <MenuItem
                  key={timeZoneOption.value}
                  onClick={() => handleTimeZoneSelection(timeZoneOption)}
                  selected={timeZoneOption.value === value}
                >
                  <ListItemText>{timeZoneOption.label}</ListItemText>
                  <Typography variant="body2">{timeZoneOption.longOffset}</Typography>
                </MenuItem>
                {timeZoneOption.value === 'local' && <Divider />}
              </Box>
            ))}
          </MenuList>
        </Paper>
      </Box>
    </ClickAwayListener>
  );
}
