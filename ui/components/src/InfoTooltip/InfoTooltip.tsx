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

import { ReactElement, ReactNode } from 'react';
import {
  styled,
  TooltipProps as MuiTooltipProps,
  Tooltip as MuiTooltip,
  tooltipClasses,
  Typography,
} from '@mui/material';

export type TooltipPlacement = 'top' | 'left' | 'right' | 'bottom';

interface InfoTooltipProps {
  description: string;
  children: ReactNode;
  id?: string;
  title?: string;
  placement?: TooltipPlacement;
  enterDelay?: number; // default is 500ms
  enterNextDelay?: number; // default is 500ms
}

export const InfoTooltip = ({
  id,
  title,
  description,
  placement,
  children,
  enterDelay,
  enterNextDelay,
}: InfoTooltipProps): ReactElement => {
  // Wrap children in a span to cover the following use cases:
  //  - Disabled buttons. MUI console.errors on putting these inside a tooltip.
  //  - Non-element tooltip children (e.g. text). The tooltip needs something that
  //   can have a ref as a child.
  // We wrap in a `span` and not a `div` to minimize the impact on page layout
  // and styles.
  const wrappedChildren = <span>{children}</span>;

  return (
    <StyledTooltip
      arrow
      id={id}
      placement={placement ?? 'top'}
      title={<TooltipContent title={title} description={description} />}
      enterDelay={enterDelay ?? 500}
      enterNextDelay={enterNextDelay ?? 500}
    >
      {wrappedChildren}
    </StyledTooltip>
  );
};

const TooltipContent = ({ title, description }: Pick<InfoTooltipProps, 'title' | 'description'>): ReactElement => {
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
          whiteSpace: 'pre-line',
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
