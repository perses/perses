// Copyright 2021 The Perses Authors
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
import { TOOLTIP_LABELS_MAX_WIDTH } from './tooltip-model';

interface SeriesInfoProps {
  seriesName: string;
  y: number;
  markerColor: string;
  totalSeries: number;
  wrapLabels?: boolean;
}

export function SeriesInfo(props: SeriesInfoProps) {
  const { seriesName, y, markerColor, totalSeries, wrapLabels } = props;

  // TODO (sjcobb): regex to remove __name__, improve series labels
  const formattedSeriesLabels = seriesName.replace(/[{}"]/g, '');

  if (totalSeries === 1) {
    const jsonFormattedSeries = seriesName[0] === '{' ? true : false;
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
          <SeriesMarker markerColor={markerColor} />
          <Box component="span">
            value:
            <Box
              component="span"
              sx={(theme) => ({
                color: theme.palette.common.white,
                fontWeight: 700,
                paddingLeft: '2px',
              })}
            >
              {y}
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
          {formattedSeriesLabels.split(',').map((name) => {
            if (name) {
              const [key, value] = jsonFormattedSeries ? name.split(':') : name.split('=');
              const formattedKey = value !== undefined ? `${key}: ` : key;
              return (
                <Box key={name} sx={{ display: 'flex', gap: '4px' }}>
                  <Typography sx={{ fontSize: '11px' }}>{formattedKey}</Typography>
                  <Typography
                    sx={(theme) => ({
                      color: theme.palette.common.white,
                      fontWeight: 700,
                      fontSize: '11px',
                    })}
                  >
                    {value}
                  </Typography>
                </Box>
              );
            }
          })}
        </Box>
      </Stack>
    );
  }

  const inlineSeriesLabels = formattedSeriesLabels.replace(/[,]/g, ', ').replace(/[:=]/g, ': ');
  return (
    <Box
      sx={{
        display: 'table-row',
        paddingTop: 0.5,
      }}
    >
      <Box
        sx={{
          display: 'table-cell',
          maxWidth: '520px',
        }}
      >
        <SeriesMarker markerColor={markerColor} />
        <Box
          component="span"
          sx={(theme) => ({
            color: theme.palette.common.white,
            display: 'inline-block',
            maxWidth: TOOLTIP_LABELS_MAX_WIDTH,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: wrapLabels ? 'normal' : 'nowrap',
            width: 'calc(100% - 20px)',
          })}
        >
          {inlineSeriesLabels}
        </Box>
      </Box>
      <Box
        sx={{
          display: 'table-cell',
          fontWeight: '700',
          paddingLeft: 1.5,
          textAlign: 'right',
          verticalAlign: 'top',
        }}
      >
        {y}
      </Box>
    </Box>
  );
}
