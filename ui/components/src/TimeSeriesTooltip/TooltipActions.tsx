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

// LOGZ.IO CHANGE START:: Drilldown panel [APPZ-377]
import { Box, Icon, MenuItem, Stack, Typography } from '@mui/material';
import Magnify from 'mdi-material-ui/Magnify';
import {
  DRILLDOWN_HELP_TEXT,
  PointAction,
  SELECT_SERIES_HELP_TEXT,
  TOOLTIP_BG_COLOR_FALLBACK,
  TOOLTIP_MAX_WIDTH,
} from './tooltip-model';
import { NearbySeriesInfo } from './nearby-series';

export interface TooltipActionProps {
  actions: PointAction[];
  selectedSeries: NearbySeriesInfo | undefined;
  isPinned: boolean;
  onUnpinClick?: () => void;
}
export const TooltipActions: React.FC<TooltipActionProps> = ({ actions, selectedSeries, onUnpinClick, isPinned }) => {
  return (
    <Box
      sx={(theme) => ({
        width: '100%',
        maxWidth: TOOLTIP_MAX_WIDTH,
        padding: theme.spacing(0.5, 1),
        backgroundColor: theme.palette.common.white ?? TOOLTIP_BG_COLOR_FALLBACK,
        position: 'sticky',
        top: 0,
        left: 0,
      })}
    >
      {!isPinned ? (
        <Box
          sx={(theme) => ({
            display: 'flex',
            padding: theme.spacing(1),
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            color: theme.palette.text.primary,
          })}
        >
          <Typography fontSize={12}>{DRILLDOWN_HELP_TEXT}</Typography>
          <Icon>
            <Magnify />
          </Icon>
        </Box>
      ) : !selectedSeries ? (
        <Box
          sx={(theme) => ({
            display: 'flex',
            padding: theme.spacing(1),
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            color: theme.palette.text.primary,
          })}
        >
          <Typography fontSize="12">{SELECT_SERIES_HELP_TEXT}</Typography>
          <Icon>
            <Magnify />
          </Icon>
        </Box>
      ) : (
        <Stack my={0.5}>
          {actions.map((action) => {
            return (
              <MenuItem
                disabled={selectedSeries === undefined}
                key={action.label}
                sx={{ padding: 0, borderRadius: 1 }}
                onClick={() => {
                  if (selectedSeries) {
                    action.onClick(selectedSeries);
                    onUnpinClick?.();
                  }
                }}
              >
                <Box
                  sx={(theme) => ({
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: theme.spacing(0.5, 1),
                    gap: 1,
                    height: 32,
                  })}
                >
                  {action.icon && action.icon}
                  <Typography fontSize="12px">{action.label}</Typography>
                </Box>
              </MenuItem>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};
// LOGZ.IO CHANGE END:: Drilldown panel [APPZ-377]
