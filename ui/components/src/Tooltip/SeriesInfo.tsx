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

import { Box } from '@mui/material';
import { SeriesMarker } from './SeriesMarker';
import { SeriesLabelsStack } from './SeriesLabelsStack';
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
      <SeriesLabelsStack
        formattedY={formattedY}
        metricName={metricName}
        metricLabels={splitLabels}
        markerColor={markerColor}
      />
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
