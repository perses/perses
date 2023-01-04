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
  dashboardName: string;
  dashboardProject: string;
}

function DashboardBreadcrumbs(props: DashboardBreadcrumbsProps) {
  const { dashboardName, dashboardProject } = props;
  return (
    <Breadcrumbs sx={{ fontSize: 'large' }}>
      <Link underline={'hover'} variant={'h2'} component={RouterLink} to={`/projects/${dashboardProject}`}>
        {dashboardProject}
      </Link>
      <Typography variant={'h2'}>{dashboardName}</Typography>
    </Breadcrumbs>
  );
}

export default DashboardBreadcrumbs;
