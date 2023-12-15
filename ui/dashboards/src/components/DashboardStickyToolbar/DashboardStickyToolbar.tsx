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

import { useState } from 'react';
import { AppBar, Box, IconButton, SxProps, Theme, useMediaQuery, useScrollTrigger, useTheme } from '@mui/material';
import PinOutline from 'mdi-material-ui/PinOutline';
import PinOffOutline from 'mdi-material-ui/PinOffOutline';
import { TemplateVariableList } from '../Variables';
import { TimeRangeControls } from '../TimeRangeControls';

interface DashboardStickyToolbarProps {
  initialVariableIsSticky?: boolean;
  sx?: SxProps<Theme>;
}

export function DashboardStickyToolbar(props: DashboardStickyToolbarProps) {
  const [isPin, setIsPin] = useState(props.initialVariableIsSticky);

  const scrollTrigger = useScrollTrigger({ disableHysteresis: true });
  const isSticky = scrollTrigger && props.initialVariableIsSticky && isPin;

  const isBiggerThanMd = useMediaQuery(useTheme().breakpoints.up('md'));

  return (
    // marginBottom={-1} counteracts the marginBottom={1} on every variable input.
    // The margin on the inputs is for spacing between inputs, but is not meant to add space to bottom of the container.
    <Box marginBottom={-1} data-testid="variable-list">
      <AppBar
        color="inherit"
        position={isSticky ? 'fixed' : 'static'}
        elevation={isSticky ? 4 : 0}
        sx={{ backgroundColor: 'inherit', ...props.sx }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          sx={{
            flexDirection: isBiggerThanMd ? 'row' : 'column',
          }}
        >
          <Box
            display="flex"
            flexWrap={!isSticky && isBiggerThanMd ? 'wrap' : 'nowrap'}
            maxWidth={isSticky || !isBiggerThanMd ? '100vw' : '100%'}
            maxHeight="150px" // Limit the vertical space used to ~3 rows of variables
            pt={1}
            pl={isSticky ? 1 : 0}
            mt={isSticky && isBiggerThanMd ? 0.5 : 0}
            ml={isSticky && isBiggerThanMd ? 0.5 : 0}
            sx={{
              overflowX: !isSticky && isBiggerThanMd ? 'hidden' : 'auto',
              // Firefox:
              scrollbarWidth: 'thin',
              // Safari and Chrome:
              '&::-webkit-scrollbar': {
                height: '8px',
                backgroundColor: (theme) => theme.palette.grey['300'],
              },
              '&::-webkit-scrollbar-thumb': {
                background: (theme) => theme.palette.grey['600'],
              },
            }}
          >
            <TemplateVariableList></TemplateVariableList>
            {props.initialVariableIsSticky && (
              <IconButton onClick={() => setIsPin(!isPin)}>{isPin ? <PinOutline /> : <PinOffOutline />}</IconButton>
            )}
          </Box>
          {isSticky && (
            <Box m={isBiggerThanMd ? 1.5 : 1} mt={isBiggerThanMd ? 1.5 : 0.5}>
              <TimeRangeControls></TimeRangeControls>
            </Box>
          )}
        </Box>
      </AppBar>
    </Box>
  );
}
