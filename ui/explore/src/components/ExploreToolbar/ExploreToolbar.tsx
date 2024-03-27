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

import { Stack, Box, useTheme, useMediaQuery } from '@mui/material';
import { TimeRangeControls } from '@perses-dev/dashboards';
import React from 'react';

export interface ExploreToolbarProps {
  exploreTitleComponent?: React.ReactNode;
}

export const ExploreToolbar = (props: ExploreToolbarProps) => {
  const { exploreTitleComponent } = props;

  const isBiggerThanLg = useMediaQuery(useTheme().breakpoints.up('lg'));

  const testId = 'explore-toolbar';

  return (
    <Stack data-testid={testId}>
      <Box sx={{ display: 'flex', width: '100%' }}>
        {exploreTitleComponent}
        <Stack
          direction="row"
          spacing={1}
          ml="auto"
          flexWrap={isBiggerThanLg ? 'nowrap' : 'wrap-reverse'}
          justifyContent="end"
        >
          <TimeRangeControls />
        </Stack>
      </Box>
    </Stack>
  );
};
