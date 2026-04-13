// Copyright The Perses Authors
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

import {
  Breadcrumbs as MUIBreadcrumbs,
  BreadcrumbsProps as MUIBreadcrumbsProps,
  Link,
  styled,
  Stack,
  Typography,
} from '@mui/material';
import { SxProps, SystemStyleObject, Theme } from '@mui/system';
import ChevronRight from 'mdi-material-ui/ChevronRight';
import { Link as RouterLink } from 'react-router-dom';
import { ReactElement } from 'react';

export type BreadcrumbVariant = 'default' | 'workspace';

function getBreadcrumbSx(variant: BreadcrumbVariant): SystemStyleObject<Theme> {
  if (variant === 'workspace') {
    return {
      color: 'primary.contrastText',
      minHeight: 42,
      px: 1,
      display: 'flex',
      alignItems: 'center',
      '& .MuiBreadcrumbs-separator': {
        marginInline: 0.75,
        color: 'rgba(255, 255, 255, 0.54)',
      },
      '& .MuiSvgIcon-root': {
        color: 'primary.contrastText',
      },
    };
  }

  return {
    color: 'text.secondary',
    minHeight: 32,
    px: 0.5,
    display: 'flex',
    alignItems: 'center',
    '& .MuiBreadcrumbs-separator': {
      marginInline: 0.75,
      color: 'text.disabled',
    },
    '& .MuiSvgIcon-root': {
      color: 'text.secondary',
    },
  };
}

const StyledBreadcrumbs = styled(MUIBreadcrumbs)(({ theme }) => ({
  paddingLeft: theme.spacing(0.5),
  overflowX: 'auto',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  '& .MuiBreadcrumbs-ol': {
    flexWrap: 'nowrap',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
}));

export interface BreadcrumbsProps extends Omit<MUIBreadcrumbsProps, 'color'> {
  variant?: BreadcrumbVariant;
}

type BreadcrumbSxEntry = Exclude<SxProps<Theme>, readonly unknown[]>;

export function Breadcrumbs(props: BreadcrumbsProps): ReactElement {
  const { sx, variant = 'default', ...rest } = props;
  const breadcrumbSx = getBreadcrumbSx(variant);
  let mergedSx: SxProps<Theme> = breadcrumbSx;

  if (Array.isArray(sx)) {
    mergedSx = [breadcrumbSx, ...(sx as BreadcrumbSxEntry[])];
  } else if (sx !== undefined) {
    mergedSx = [breadcrumbSx, sx as BreadcrumbSxEntry];
  }

  return (
    <StyledBreadcrumbs
      aria-label="breadcrumb"
      separator={<ChevronRight sx={{ fontSize: 14 }} />}
      sx={mergedSx}
      {...rest}
    />
  );
}

export function HomeLinkCrumb({ variant }: { variant?: BreadcrumbVariant }): ReactElement {
  return (
    <LinkCrumb to="/" variant={variant}>
      Home
    </LinkCrumb>
  );
}

export interface StackCrumbProps {
  children?: React.ReactNode;
  variant?: BreadcrumbVariant;
}

export function StackCrumb(props: StackCrumbProps): ReactElement {
  const { children, variant = 'default' } = props;
  const iconColor = variant === 'workspace' ? 'primary.contrastText' : 'text.secondary';

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={0.75}
      sx={{
        minWidth: 0,
        '& .MuiSvgIcon-root': {
          fontSize: 18,
          color: iconColor,
        },
      }}
    >
      {children}
    </Stack>
  );
}

export interface LinkCrumbProps {
  children?: React.ReactNode;
  to: string;
  variant?: BreadcrumbVariant;
}

export function LinkCrumb(props: LinkCrumbProps): ReactElement {
  const { children, to, variant = 'default' } = props;
  const isWorkspace = variant === 'workspace';

  return (
    <Link
      underline="none"
      component={RouterLink}
      to={to}
      color="inherit"
      sx={(theme) => ({
        display: 'inline-flex',
        alignItems: 'center',
        minWidth: 0,
        fontSize: isWorkspace ? 15 : 14,
        fontWeight: 500,
        lineHeight: 1.25,
        letterSpacing: 0,
        color: isWorkspace ? theme.palette.primary.contrastText : theme.palette.text.secondary,
        borderRadius: theme.shape.borderRadius,
        paddingBlock: 2 / 8,
        transition: theme.transitions.create('color', {
          duration: theme.transitions.duration.shorter,
        }),
        '&:hover': {
          color: isWorkspace ? theme.palette.primary.contrastText : theme.palette.text.primary,
          opacity: 1,
        },
        '&:focus-visible': {
          outlineOffset: 3,
          borderRadius: theme.shape.borderRadius,
        },
        ...(isWorkspace
          ? {
              opacity: 0.88,
            }
          : null),
      })}
    >
      {children}
    </Link>
  );
}

export interface TitleCrumbProps {
  children?: React.ReactNode;
  variant?: BreadcrumbVariant;
  inheritTypography?: boolean;
}

export function TitleCrumb(props: TitleCrumbProps): ReactElement {
  const { children, variant = 'default', inheritTypography = false } = props;
  const isWorkspace = variant === 'workspace';
  let fontSize: 'inherit' | number = 'inherit';

  if (!inheritTypography) {
    fontSize = isWorkspace ? 15 : 14;
  }

  const fontWeight = inheritTypography ? 'inherit' : 700;
  const lineHeight = inheritTypography ? 'inherit' : 1.25;
  const letterSpacing = inheritTypography ? 'inherit' : 0;

  return (
    <Typography
      component="span"
      color={isWorkspace ? 'primary.contrastText' : 'text.primary'}
      fontSize={fontSize}
      fontWeight={fontWeight}
      lineHeight={lineHeight}
      letterSpacing={letterSpacing}
      sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
    >
      {children}
    </Typography>
  );
}
