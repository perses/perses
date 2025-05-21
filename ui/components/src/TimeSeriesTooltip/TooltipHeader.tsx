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

import { Box, Typography, Stack, Switch, IconButton } from '@mui/material';
import { memo, ReactElement } from 'react';
import Close from 'mdi-material-ui/Close';
import { getDateAndTime } from '../utils';
import { NearbySeriesArray } from './nearby-series';
import { TOOLTIP_BG_COLOR_FALLBACK, TOOLTIP_MAX_WIDTH } from './tooltip-model';

export interface TooltipHeaderProps {
  nearbySeries: NearbySeriesArray;
  totalSeries: number;
  isTooltipPinned: boolean;
  showAllSeries: boolean;
  enablePinning?: boolean;
  onShowAllClick?: (checked: boolean) => void;
  onUnpinClick?: () => void;
}

export const TooltipHeader = memo(function TooltipHeader({
  nearbySeries,
  totalSeries,
  isTooltipPinned,
  showAllSeries,
  enablePinning = true,
  onShowAllClick,
  onUnpinClick,
}: TooltipHeaderProps) {
  const seriesTimeMs = nearbySeries[0]?.date ?? null;
  if (seriesTimeMs === null) {
    return null;
  }

  const formatTimeSeriesHeader = (timeMs: number): ReactElement => {
    const { formattedTime, formattedDate } = getDateAndTime(timeMs);
    return (
      <Box>
        <Typography
          variant="caption"
          sx={(theme) => ({
            // LOGZ.IO CHANGE START:: Drilldown panel [APPZ-377]
            color: theme.palette.text.primary,
            fontSize: 12,
            // LOGZ.IO CHANGE END:: Drilldown panel [APPZ-377]
          })}
        >
          {formattedDate}
        </Typography>
        <Typography fontSize={12} variant="caption">
          <strong>{formattedTime}</strong>
        </Typography>
      </Box>
    );
  };

  // TODO: accurately calc whether more series are outside scrollable region using yBuffer, avg series name length, TOOLTIP_MAX_HEIGHT
  const showAllSeriesToggle = enablePinning && totalSeries > 5;

  return (
    <Box
      sx={(theme) => ({
        width: '100%',
        maxWidth: TOOLTIP_MAX_WIDTH,
        padding: theme.spacing(1.5, 2, 0.5, 2),
        top: 0,
        left: 0,
        // LOGZ.IO CHANGE START:: Drilldown panel [APPZ-377]
        backgroundColor: theme.palette.common.white ?? TOOLTIP_BG_COLOR_FALLBACK,
        borderBottom: `1px solid ${theme.palette.divider}`,
        position: 'sticky',
        // LOGZ.IO CHANGE END:: Drilldown panel [APPZ-377]
      })}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'start',
          alignItems: 'center',
          paddingBottom: 0.5,
        }}
      >
        {formatTimeSeriesHeader(seriesTimeMs)}
        <Stack direction="row" gap={0.5} sx={{ marginLeft: 'auto' }}>
          {showAllSeriesToggle && (
            <Stack direction="row" gap={0.5} alignItems="center" sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: 11 }}>Show All</Typography>
              <Switch
                checked={showAllSeries}
                size="small"
                onChange={(_, checked) => {
                  if (onShowAllClick !== undefined) {
                    return onShowAllClick(checked);
                  }
                }}
              />
            </Stack>
          )}
          {enablePinning && (
            <Stack direction="row" alignItems="center">
              {/* LOGZ.IO CHANGE START:: Drilldown panel [APPZ-377] */}
              {isTooltipPinned && (
                <IconButton
                  size="small"
                  onClick={() => {
                    if (onUnpinClick !== undefined) {
                      onUnpinClick();
                    }
                  }}
                >
                  <Close sx={{ fontSize: 14 }} />
                </IconButton>
              )}
              {/* LOGZ.IO CHANGE END:: Drilldown panel [APPZ-377] */}
            </Stack>
          )}
        </Stack>
      </Box>
    </Box>
  );
});
