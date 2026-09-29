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

import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import type { ReactElement, ReactNode } from 'react';

interface HomeListCardProps {
  icon: ReactElement;
  title: string;
  description: string;
  children: ReactNode;
  centerContent?: boolean;
  testId?: string;
}

export function HomeListCard({
  icon,
  title,
  description,
  children,
  centerContent = false,
  testId,
}: HomeListCardProps): ReactElement {
  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      data-testid={testId}
    >
      <CardContent sx={{ flex: '0 0 auto' }}>
        <Stack spacing={0.75}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon}
            <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {title}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Stack>
      </CardContent>
      <CardContent
        sx={{
          flex: '1 1 auto',
          pt: 0,
          minHeight: 0,
          ...(centerContent ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}),
        }}
      >
        {children}
      </CardContent>
    </Card>
  );
}