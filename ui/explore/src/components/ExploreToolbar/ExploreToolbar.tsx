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

import { Stack, Box, useTheme, useMediaQuery, Button } from '@mui/material';
import { TimeRangeControls } from '@perses-dev/dashboards';
import AddIcon from 'mdi-material-ui/Plus';

export interface ExploreToolbarProps {
  exploreTitleComponent?: JSX.Element;
  onQueryAdd: () => void;
}

export const ExploreToolbar = (props: ExploreToolbarProps) => {
  const { exploreTitleComponent, onQueryAdd } = props;

  const isBiggerThanLg = useMediaQuery(useTheme().breakpoints.up('lg'));

  const testId = 'explore-toolbar';

  return (
    <Stack spacing={1} data-testid={testId}>
      <Box px={2} py={1} display="flex">
        {exploreTitleComponent}
      </Box>

      <Box
        sx={{
          display: 'flex',
          width: '100%',
          alignItems: 'start',
          padding: (theme) => theme.spacing(1, 2, 0, 2),
        }}
      >
        <Stack ml="auto" direction="row" flexWrap={isBiggerThanLg ? 'nowrap' : 'wrap-reverse'} justifyContent="end">
          <Stack direction="row" spacing={1} ml={1}>
            <TimeRangeControls />
            <Button variant="contained" startIcon={<AddIcon />} sx={{ marginLeft: 'auto' }} onClick={onQueryAdd}>
              Add Query
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
};
