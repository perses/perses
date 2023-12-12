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

import { Box, Typography } from '@mui/material';
import Archive from 'mdi-material-ui/Archive';
import ViewDashboardIcon from 'mdi-material-ui/ViewDashboard';
import { HomeLinkCrumb, Breadcrumbs, LinkCrumb, StackCrumb, TitleCrumb } from './breadcrumbs';

interface ProjectBreadcrumbsProps {
  projectName: string;
  dashboardName?: string;
}

function ProjectBreadcrumbs(props: ProjectBreadcrumbsProps) {
  const { projectName, dashboardName } = props;

  if (dashboardName) {
    return (
      <Breadcrumbs
        id="breadcrumbs"
        sx={{
          overflowX: 'scroll',
          '& .MuiBreadcrumbs-ol': {
            flexWrap: 'nowrap',
          },
        }}
      >
        <HomeLinkCrumb />
        <LinkCrumb to={`/projects/${projectName}`}>
          <StackCrumb>
            <Archive fontSize={'small'} />
            {projectName}
          </StackCrumb>
        </LinkCrumb>
        <StackCrumb>
          <ViewDashboardIcon fontSize={'small'} />
          <Typography variant={'h3'}>{dashboardName}</Typography>
        </StackCrumb>
      </Breadcrumbs>
    );
  }

  return (
    <Breadcrumbs
      id="breadcrumbs"
      sx={{
        overflowX: 'scroll',
        scrollbarWidth: 'none' /* Firefox */,
        '& .MuiBreadcrumbs-ol': {
          flexWrap: 'nowrap',
        },
        '&::-webkit-scrollbar': {
          display: 'none' /* Safari and Chrome */,
        },
      }}
    >
      {' '}
      <HomeLinkCrumb />
      <StackCrumb>
        <Archive fontSize={'large'} />
        <TitleCrumb>{projectName}</TitleCrumb>
      </StackCrumb>
    </Breadcrumbs>
  );
}

export default ProjectBreadcrumbs;
