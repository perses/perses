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
  title?: string;
  placement?: TooltipPlacement;
}

export const InfoTooltip = ({ title, description, placement, children }: InfoTooltipProps) => {
  return (
    <StyledTooltip arrow placement={placement} title={<TooltipContent title={title} description={description} />}>
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
            lineHeight: '1.25rem',
          })}
        >
          {title}
        </Typography>
      )}
      <Typography
        variant="caption"
        sx={(theme) => ({
          color: theme.palette.text.primary,
          lineHeight: '1.38rem',
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
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.grey[900],
    maxWidth: '300px',
    padding: theme.spacing(1),
    boxShadow: '0px 1px 1px 0px #00000033',
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.background.paper,
    '&::before': {
      backgroundColor: theme.palette.secondary.main,
    },
  },
}));
