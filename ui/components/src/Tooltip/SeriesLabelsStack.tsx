// Copyright 2022 The Perses Authors
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

import { Box, Divider, Stack, Typography } from '@mui/material';
import { SeriesMarker } from './SeriesMarker';

export interface SeriesLabelsStackProps {
  formattedY: string;
  metricName: string;
  metricLabels: string[];
  markerColor: string;
}

export function SeriesLabelsStack(props: SeriesLabelsStackProps) {
  const { formattedY, markerColor, metricName, metricLabels } = props;
  return (
    <Stack spacing={0.5}>
      <Box
        sx={(theme) => ({
          height: '16px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'left',
          color: theme.palette.common.white,
          fontSize: '11px',
        })}
      >
        <SeriesMarker markerColor={markerColor} sx={{ marginTop: 0.25 }} />
        <Box component="span">
          {metricName}
          <Box
            component="span"
            sx={(theme) => ({
              color: theme.palette.common.white,
              fontWeight: 700,
              paddingLeft: '2px',
            })}
          >
            {formattedY}
          </Box>
        </Box>
      </Box>
      <Divider
        sx={(theme) => ({
          borderColor: theme.palette.grey['500'],
        })}
      />
      <Box
        sx={(theme) => ({
          color: theme.palette.common.white,
        })}
      >
        {metricLabels.map((label) => {
          // show labels on separate lines when many labels and only one focused series
          if (label) {
            const [name, value] = label.split('=');
            const formattedName = value !== undefined ? `${name}: ` : name;
            const formattedValue = value !== undefined ? value.replace(/(^"|"$)/g, '') : value;
            return (
              <Box key={label} sx={{ display: 'flex', gap: '4px' }}>
                <Typography sx={{ fontSize: '11px' }}>{formattedName}</Typography>
                <Typography
                  sx={(theme) => ({
                    color: theme.palette.common.white,
                    fontWeight: 700,
                    fontSize: '11px',
                  })}
                >
                  {formattedValue}
                </Typography>
              </Box>
            );
          }
        })}
      </Box>
    </Stack>
  );
}
