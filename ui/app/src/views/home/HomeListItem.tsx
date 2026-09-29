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

import { Box, Typography } from '@mui/material';
import type { ReactElement } from 'react';
import { Link as RouterLink } from 'react-router-dom';

export interface HomeListItemProps {
  to: string;
  ariaLabel: string;
  title: string;
  subtitle: string;
  icon: ReactElement;
  iconVariant?: 'filled' | 'outlined';
  subtitleIcon?: ReactElement;
  action?: ReactElement;
}

export function HomeListItem({
  to,
  ariaLabel,
  title,
  subtitle,
  icon,
  iconVariant = 'filled',
  subtitleIcon,
  action,
}: HomeListItemProps): ReactElement {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        pr: action ? 1 : 0,
        borderRadius: 1.5,
        transition: 'background-color 0.15s ease',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box
        component={RouterLink}
        to={to}
        aria-label={ariaLabel}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          py: 2,
          px: 1,
          textDecoration: 'none',
          color: 'inherit',
          cursor: 'pointer',
          flex: 1,
          minWidth: 0,
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
        }}
      >
        <Box
          sx={{
            p: 1.25,
            borderRadius: 1.5,
            ...(iconVariant === 'outlined'
              ? { bgcolor: 'transparent', border: '1px solid', borderColor: 'primary.main' }
              : { bgcolor: 'primary.main' }),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            {subtitleIcon}
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        </Box>
      </Box>
      {action}
    </Box>
  );
}