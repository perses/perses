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

import { Box, Typography, Stack } from '@mui/material';
import { SeriesMarker } from './SeriesMarker';
import { SeriesLabelsStack } from './SeriesLabelsStack';
import { TOOLTIP_LABELS_MAX_WIDTH, EMPHASIZED_SERIES_DESCRIPTION, NEARBY_SERIES_DESCRIPTION } from './tooltip-model';

export interface SeriesInfoProps {
  seriesName: string;
  y: number;
  formattedY: string;
  markerColor: string;
  totalSeries: number;
  emphasizeText?: boolean;
  wrapLabels?: boolean;
}

export function SeriesInfo(props: SeriesInfoProps) {
  const { seriesName, formattedY, markerColor, totalSeries, emphasizeText = false, wrapLabels = true } = props;

  // metric __name__ comes before opening curly brace, ignore if not populated
  // ex with metric name: node_load15{env="demo",job="node"}
  // ex without metric name: {env="demo",job="node"}
  const splitName = seriesName.split('{');
  const seriesLabels = splitName[1] ?? seriesName;

  // remove curly braces that wrap labels
  const formattedSeriesLabels = seriesLabels.replace(/[{}]/g, '');

  // determine whether to show labels on separate lines
  const splitLabels = formattedSeriesLabels.split(',');
  if (totalSeries === 1 && splitLabels.length > 1) {
    const metricName = splitName[0] ? `${splitName[0]}:` : 'value:';
    return (
      <SeriesLabelsStack
        formattedY={formattedY}
        metricName={metricName}
        metricLabels={splitLabels}
        markerColor={markerColor}
      />
    );
  }

  // add space after commas so wrapLabels works
  const formattedSeriesInfo = seriesName.replace(/[,]/g, ', ');

  return (
    <Stack direction="row" pb={0.5}>
      <SeriesMarker
        markerColor={markerColor}
        sx={{
          marginTop: 0.6,
        }}
      />
      <Box
        sx={{
          flex: 1,
          width: 'calc(100% - 20px)',
          minWidth: 150,
          maxWidth: TOOLTIP_LABELS_MAX_WIDTH,
        }}
      >
        <Typography
          variant="body1"
          sx={(theme) => ({
            color: theme.palette.common.white,
            fontSize: 11,
            fontWeight: emphasizeText ? theme.typography.fontWeightBold : theme.typography.fontWeightRegular,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: '3', // Allows long series names to wrap to three lines before adding ellipsis
            textOverflow: 'ellipsis',
            whiteSpace: wrapLabels ? 'pre-line' : 'nowrap',
            // wordBreak: 'break-all',
            overflow: 'hidden',
            '&:hover': {
              WebkitLineClamp: '10', // Show full series name on hover if it wraps to more than 3 lines
            },
          })}
          aria-label={emphasizeText ? EMPHASIZED_SERIES_DESCRIPTION : NEARBY_SERIES_DESCRIPTION}
        >
          {formattedSeriesInfo}
        </Typography>
      </Box>

      <Box
        sx={{
          marginLeft: 'auto',
        }}
      >
        <Typography
          variant="body1"
          sx={(theme) => ({
            fontSize: 11,
            fontWeight: emphasizeText ? theme.typography.fontWeightBold : theme.typography.fontWeightRegular,
          })}
        >
          {formattedY}
        </Typography>
      </Box>
    </Stack>
  );
}
