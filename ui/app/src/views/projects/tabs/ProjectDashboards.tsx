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

import { Card, CardProps } from '@mui/material';
import { ReactElement } from 'react';
import { useDashboardList } from '../../../model/dashboard-client';
import { DashboardList } from '../../../components/DashboardList/DashboardList';
import { useIsEphemeralDashboardEnabled } from '../../../context/Config';

interface ProjectDashboardsProps extends CardProps {
  projectName: string;
  hideToolbar?: boolean;
}

export function ProjectDashboards({ projectName, hideToolbar, ...props }: ProjectDashboardsProps): ReactElement {
  const { data, isLoading } = useDashboardList({ project: projectName });
  const isEphemeralDashboardEnabled = useIsEphemeralDashboardEnabled();

  return (
    <Card {...props}>
      <DashboardList
        dashboardList={data ?? []}
        hideToolbar={hideToolbar}
        isLoading={isLoading}
        initialState={{
          columns: {
            columnVisibilityModel: {
              id: false,
              project: false,
              version: false,
            },
          },
        }}
        isEphemeralDashboardEnabled={isEphemeralDashboardEnabled}
      />
    </Card>
  );
}
