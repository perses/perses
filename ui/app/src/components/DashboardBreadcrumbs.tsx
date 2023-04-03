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

interface DashboardBreadcrumbsProps {
  dashboardProject?: string;
  dashboardName?: string;
}

function DashboardBreadcrumbs(props: DashboardBreadcrumbsProps) {
  const { dashboardProject, dashboardName } = props;

  if (dashboardName) {
    return (
      <Breadcrumbs sx={{ fontSize: 'large' }}>
        <Link underline={'hover'} variant={'h3'} component={RouterLink} to={'/'}>
          Home
        </Link>
        <Link underline={'hover'} variant={'h3'} component={RouterLink} to={`/projects/${dashboardProject}`}>
          {dashboardProject}
        </Link>
        <Typography variant={'h3'}>{dashboardName}</Typography>
      </Breadcrumbs>
    );
  }

  if (dashboardProject) {
    return (
      <Breadcrumbs sx={{ fontSize: 'large' }}>
        <Link underline={'hover'} variant={'h3'} component={RouterLink} to={'/'}>
          Home
        </Link>
        <Typography variant={'h3'}>{dashboardProject}</Typography>
      </Breadcrumbs>
    );
  }

  return (
    <Breadcrumbs sx={{ fontSize: 'large' }}>
      <Typography variant={'h3'}>Home</Typography>
    </Breadcrumbs>
  );
}

export default DashboardBreadcrumbs;
