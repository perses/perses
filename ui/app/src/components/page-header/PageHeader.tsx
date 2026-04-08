// Copyright The Perses Authors
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

import { Box, Stack, SxProps, Theme, Typography } from '@mui/material';
import { ReactElement, ReactNode } from 'react';

export interface PageHeaderProps {
  breadcrumb: ReactNode;
  title: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  sx?: SxProps<Theme>;
}

function PageHeader(props: PageHeaderProps): ReactElement {
  const { breadcrumb, title, icon, actions, sx } = props;

  return (
    <Stack gap={1} sx={sx}>
      {breadcrumb}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        gap={1.5}
      >
        <Stack direction="row" alignItems="center" gap={1.25} sx={{ minWidth: 0 }}>
          {icon !== undefined && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.primary',
                '& .MuiSvgIcon-root': {
                  fontSize: { xs: 24, sm: 28 },
                },
              }}
            >
              {icon}
            </Box>
          )}
          <Typography
            variant="h1"
            sx={{
              minWidth: 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </Typography>
        </Stack>
        {actions !== undefined && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            gap={1}
            sx={{ alignSelf: { xs: 'stretch', md: 'center' }, width: { xs: '100%', md: 'auto' } }}
          >
            {actions}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}

export default PageHeader;
