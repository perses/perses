// Copyright 2022 The Perses Authors
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

import { DashboardResource } from '@perses-dev/core';
import { useNavigate } from 'react-router-dom';
import { Divider, List, ListItem, ListItemButton, ListItemText } from '@mui/material';

export interface DashboardListProperties {
  dashboardList: DashboardResource[];
}

function DashboardList(props: DashboardListProperties) {
  const navigate = useNavigate();
  return (
    <List>
      {props.dashboardList.map((dashboard, i) => {
        return (
          <>
            {i !== 0 && <Divider key={`divider-${i}`} />}
            <ListItem
              disablePadding
              sx={{ backgroundColor: (theme) => theme.palette.primary.main + '10' }}
              key={`list-item-${i}`}
            >
              <ListItemButton
                onClick={() =>
                  navigate(`/projects/${dashboard.metadata.project}/dashboards/${dashboard.metadata.name}`)
                }
              >
                <ListItemText primary={dashboard.metadata.name} />
              </ListItemButton>
            </ListItem>
          </>
        );
      })}
    </List>
  );
}

export default DashboardList;
