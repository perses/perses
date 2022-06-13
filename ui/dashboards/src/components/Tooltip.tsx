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

interface TooltipProps {
  description: string;
  children: React.ReactNode;
  title?: string;
  placement?: TooltipPlacement;
}

const Tooltip = ({ title, description, placement, children }: TooltipProps) => {
  return (
    <StyledTooltip arrow placement={placement} title={<TooltipContent title={title} description={description} />}>
      <div>{children}</div>
    </StyledTooltip>
  );
};

const TooltipContent = ({ title, description }: Pick<TooltipProps, 'title' | 'description'>) => {
  return (
    <>
      {title && (
        <Typography
          variant="h6"
          sx={(theme) => ({
            color: theme.palette.mode === 'dark' ? theme.palette.common.white : '#2A2E42',
            fontWeight: '700',
            fontSize: '14px',
            lineHeight: '20px',
          })}
        >
          {title}
        </Typography>
      )}
      <Typography
        sx={(theme) => ({
          color: theme.palette.mode === 'dark' ? theme.palette.common.white : '#2A2E42',
          fontSize: '12px',
          lineHeight: '14.4px',
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
    backgroundColor: theme.palette.mode === 'dark' ? '#3E4662' : '#F0F1F6',
    color: theme.palette.grey[900],
    maxWidth: '300px',
    padding: theme.spacing(1),
    boxShadow: '0px 1px 1px 0px #00000033',
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.background.paper,
    '&::before': {
      backgroundColor: theme.palette.mode === 'dark' ? '#3E4662' : '#F0F1F6',
    },
  },
}));

export default Tooltip;
