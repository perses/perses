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
import { TOOLTIP_LABELS_MAX_WIDTH } from './tooltip-model';

export interface SeriesInfoProps {
  seriesName: string;
  y: number;
  formattedY: string;
  markerColor: string;
  totalSeries: number;
  wrapLabels?: boolean;
}

export function SeriesInfo(props: SeriesInfoProps) {
  const { seriesName, formattedY, markerColor, totalSeries, wrapLabels } = props;

  // metric __name__ comes before opening curly brace, ignore if not populated
  const nameSplit = seriesName.split('{');
  const seriesLabels = nameSplit[1] ?? seriesName;

  // remove curly braces that wrap labels
  const formattedSeriesLabels = seriesLabels.replace(/[{}]/g, '');

  // determine whether to show labels on separate lines
  const splitLabels = formattedSeriesLabels.split(',');
  if (totalSeries === 1 && splitLabels.length > 1) {
    const metricName = nameSplit[0] ? `${nameSplit[0]}:` : 'value:';
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
          {splitLabels.map((name) => {
            // show labels on separate lines when many labels and only one focused series
            if (name) {
              const [key, value] = name.split('=');
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

  // add space after commas when more than one focused series
  const inlineSeriesLabels = formattedSeriesLabels.replace(/[,]/g, ', ');
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
        <SeriesMarker markerColor={markerColor} sx={{ marginTop: 0.5 }} />
        <Box
          component="span"
          sx={(theme) => ({
            color: theme.palette.common.white,
            display: 'inline-block',
            width: 'calc(100% - 20px)',
            minWidth: 150, // TODO: use clamp instead
            maxWidth: TOOLTIP_LABELS_MAX_WIDTH,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: wrapLabels ? 'normal' : 'nowrap',
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
        {formattedY}
      </Box>
    </Box>
  );
}
