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
} from '@mui/material';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import EarthIcon from 'mdi-material-ui/Earth';
import MagnifyIcon from 'mdi-material-ui/Magnify';
import { ChangeEvent, ReactElement, useState } from 'react';
import { ToolbarIconButton } from '../ToolbarIconButton';
import { InfoTooltip } from '../InfoTooltip';
import { TimeZoneOption } from '../model/timeZoneOption';

interface TimeZoneSelectorProps {
  height?: string;
  timeZoneOptions: TimeZoneOption[];
  value: string;
  onChange?: (timeZone: string) => void;
}

export function TimeZoneSelector({
  height,
  timeZoneOptions: defaultTimeZoneOptions,
  onChange,
  value = 'local',
}: TimeZoneSelectorProps): ReactElement {
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
    onChange?.(timeZone.value);
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
          <InfoTooltip description={value === 'local' ? 'Local browser time' : 'Time zone'}>
            <ToolbarIconButton
              aria-label="Timezone"
              onClick={() => setOpen(!open)}
              sx={(theme) => ({ height, paddingLeft: theme.spacing(1) })}
            >
              {value === 'local' ? localTimeZone : value}
              <EarthIcon sx={(theme) => ({ marginLeft: theme.spacing(0.5) })} />
            </ToolbarIconButton>
          </InfoTooltip>
        </Box>
        <Paper
          sx={(theme) => ({
            width: 350,
            height: 355,
            position: 'absolute',
            top: 110,
            right: 10,
            zIndex: 1,
            boxShadow: 3,
            backgroundColor: theme.palette.background.paper,
            display: open ? 'block' : 'none',
          })}
        >
          <Input
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
