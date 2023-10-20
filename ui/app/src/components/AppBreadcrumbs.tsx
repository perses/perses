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

import { Breadcrumbs, Link, Typography, styled } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

interface AppBreadcrumbsProps {
  rootPageName: string;
}

export function HomeLinkBreadcrumb() {
  return (
    <Link underline={'hover'} variant={'h3'} component={RouterLink} to={'/'}>
      Home
    </Link>
  );
}

export const StyledBreadcrumbs = styled(Breadcrumbs)({
  fontSize: 'large',
  paddingLeft: 0.5,
  lineHeight: '30px',
});

function AppBreadcrumbs(props: AppBreadcrumbsProps) {
  const { rootPageName } = props;
  return (
    <StyledBreadcrumbs sx={{ fontSize: 'large' }}>
      <HomeLinkBreadcrumb />
      <Typography variant={'h3'}>{rootPageName}</Typography>
    </StyledBreadcrumbs>
  );
}

export default AppBreadcrumbs;
