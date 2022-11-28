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

import React from 'react';
import {
  styled,
  TooltipProps as MuiTooltipProps,
  Tooltip as MuiTooltip,
  tooltipClasses,
  Typography,
} from '@mui/material';

export enum TooltipPlacement {
  Top = 'top',
  Left = 'left',
  Right = 'right',
  Bottom = 'bottom',
}

interface InfoTooltipProps {
  description: string;
  children: React.ReactNode;
  id?: string;
  title?: string;
  placement?: TooltipPlacement;
}

export const InfoTooltip = ({ id, title, description, placement, children }: InfoTooltipProps) => {
  return (
    <StyledTooltip
      arrow
      id={id}
      placement={placement}
      title={<TooltipContent title={title} description={description} />}
    >
      <div>{children}</div>
    </StyledTooltip>
  );
};

const TooltipContent = ({ title, description }: Pick<InfoTooltipProps, 'title' | 'description'>) => {
  return (
    <>
      {title && (
        <Typography
          variant="body2"
          sx={(theme) => ({
            color: theme.palette.text.primary,
            fontWeight: theme.typography.fontWeightMedium,
          })}
        >
          {title}
        </Typography>
      )}
      <Typography
        variant="caption"
        sx={(theme) => ({
          color: theme.palette.text.primary,
        })}
      >
        {description}
      </Typography>
    </>
  );
};

const StyledTooltip = styled(({ className, ...props }: MuiTooltipProps) => (
  <MuiTooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.background.tooltip,
    color: theme.palette.text.primary,
    maxWidth: '300px',
    padding: theme.spacing(1),
    boxShadow: theme.shadows[1],
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.background.tooltip,
  },
}));
