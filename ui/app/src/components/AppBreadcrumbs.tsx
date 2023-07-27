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

import { Breadcrumbs, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

interface AppBreadcrumbsProps {
  projectName?: string;
  dashboardName?: string;
  admin?: boolean;
}

function HomeLinkBreadcrumb() {
  return (
    <Link underline={'hover'} variant={'h3'} component={RouterLink} to={'/'}>
      Home
    </Link>
  );
}

/*
 * AppBreadcrumbs provide a navigation helper
 * For dashboard breadcrumb, projectName & dashboardName are mandatory
 * For project breadcrumb, projectName is mandatory
 * For admin breadcrumb, admin flag needs to be true
 * For home breadcrumb, all props need to be empty or undefined
 */
// TODO: this component should probably be split, maybe this wrapper is not useful in some cases (e.g Home and Admin?)
function AppBreadcrumbs(props: AppBreadcrumbsProps) {
  const { projectName, dashboardName, admin } = props;

  if (dashboardName && projectName) {
    return (
      <Breadcrumbs sx={{ fontSize: 'large' }}>
        <HomeLinkBreadcrumb />
        <Link underline={'hover'} variant={'h3'} component={RouterLink} to={`/projects/${projectName}`}>
          {projectName}
        </Link>
        <Typography variant={'h3'}>{dashboardName}</Typography>
      </Breadcrumbs>
    );
  }

  if (projectName) {
    return (
      <Breadcrumbs sx={{ fontSize: 'large' }}>
        <HomeLinkBreadcrumb />
        <Typography variant={'h3'}>{projectName}</Typography>
      </Breadcrumbs>
    );
  }

  if (admin) {
    return (
      <Breadcrumbs sx={{ fontSize: 'large' }}>
        <HomeLinkBreadcrumb />
        <Typography variant={'h3'}>Admin</Typography>
      </Breadcrumbs>
    );
  }

  return (
    <Breadcrumbs sx={{ fontSize: 'large' }}>
      <Typography variant={'h3'}>Home</Typography>
    </Breadcrumbs>
  );
}

export default AppBreadcrumbs;
