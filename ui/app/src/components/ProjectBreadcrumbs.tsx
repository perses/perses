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

import { Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { HomeLinkBreadcrumb, StyledBreadcrumbs } from './AppBreadcrumbs';

interface ProjectBreadcrumbsProps {
  projectName: string;
  dashboardName?: string;
  isExplore?: boolean;
}

function ProjectBreadcrumbs(props: ProjectBreadcrumbsProps) {
  const { projectName, dashboardName, isExplore } = props;

  if (dashboardName) {
    return (
      <StyledBreadcrumbs sx={{ fontSize: 'large' }}>
        <HomeLinkBreadcrumb />
        <Link underline={'hover'} variant={'h3'} component={RouterLink} to={`/projects/${projectName}`}>
          {projectName}
        </Link>
        <Typography variant={'h3'}>{dashboardName}</Typography>
      </StyledBreadcrumbs>
    );
  }

  if (isExplore) {
    return (
      <StyledBreadcrumbs sx={{ fontSize: 'large' }}>
        <HomeLinkBreadcrumb />
        <Link underline={'hover'} variant={'h3'} component={RouterLink} to={`/projects/${projectName}`}>
          {projectName}
        </Link>
        <Typography variant={'h3'}>Explore</Typography>
      </StyledBreadcrumbs>
    );
  }

  return (
    <StyledBreadcrumbs sx={{ fontSize: 'large' }}>
      <HomeLinkBreadcrumb />
      <Typography variant={'h3'}>{projectName}</Typography>
    </StyledBreadcrumbs>
  );
}

export default ProjectBreadcrumbs;
