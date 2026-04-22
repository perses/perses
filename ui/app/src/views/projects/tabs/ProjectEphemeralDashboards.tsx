// Copyright 2024 The Perses Authors
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
import { useEphemeralDashboardList } from '../../../model/ephemeral-dashboard-client';
import { EphemeralDashboardList } from '../../../components/EphemeralDashboardList/EphemeralDashboardList';

interface ProjectEphemeralDashboardsProps extends CardProps {
  projectName: string;
  hideToolbar?: boolean;
}

export function ProjectEphemeralDashboards({
  projectName,
  hideToolbar,
  ...props
}: ProjectEphemeralDashboardsProps): ReactElement {
  const { data, isLoading } = useEphemeralDashboardList(projectName);

  return (
    <Card {...props}>
      <EphemeralDashboardList
        ephemeralDashboardList={data ?? []}
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
      />
    </Card>
  );
}
