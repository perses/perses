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

import { Breadcrumbs as MUIBreadcrumbs, Link, styled, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const BREADCRUMB_HEIGHT = '35px';

export const Breadcrumbs = styled(MUIBreadcrumbs)({
  fontSize: 'large',
  paddingLeft: 0.5,
  height: BREADCRUMB_HEIGHT,
  lineHeight: BREADCRUMB_HEIGHT,
});

export function HomeLinkCrumb() {
  return <LinkCrumb to={'/'}>Home</LinkCrumb>;
}

export interface StackCrumbProps {
  children?: React.ReactNode;
}

export function StackCrumb(props: StackCrumbProps) {
  const { children } = props;

  return (
    <Stack direction="row" alignItems="center" gap={0.5}>
      {children}
    </Stack>
  );
}

export interface LinkCrumbProps {
  children?: React.ReactNode;
  to: string;
}

export function LinkCrumb(props: LinkCrumbProps) {
  const { children, to } = props;

  return (
    <Link underline={'hover'} variant={'h3'} component={RouterLink} to={to}>
      {children}
    </Link>
  );
}

export interface TitleCrumbProps {
  children?: React.ReactNode;
}

export function TitleCrumb(props: TitleCrumbProps) {
  const { children } = props;

  return <Typography variant="h1">{children}</Typography>;
}
