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

import { DashboardResource } from '@perses-dev/core';
import { useNavigate } from 'react-router-dom';
import { Box, Divider, IconButton, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import PencilIcon from 'mdi-material-ui/Pencil';
import { useState, Fragment } from 'react';
import { dashboardDisplayName } from '@perses-dev/core/dist/utils/text';
import { DeleteDashboardDialog } from './DeleteDashboardDialog/DeleteDashboardDialog';
import { RenameDashboardDialog } from './RenameDashboardDialog/RenameDashboardDialog';

export interface DashboardListProperties {
  dashboardList: DashboardResource[];
}

function DashboardList(props: DashboardListProperties) {
  const { dashboardList } = props;

  const navigate = useNavigate();

  const [targetedDashboard, setTargetedDashboard] = useState<DashboardResource>();
  const [isRenameDashboardDialogStateOpened, setRenameDashboardDialogStateOpened] = useState<boolean>(false);
  const [isDeleteDashboardDialogStateOpened, setDeleteDashboardDialogStateOpened] = useState<boolean>(false);

  const onRenameButtonClick = (dashboard: DashboardResource) => {
    setTargetedDashboard(dashboard);
    setRenameDashboardDialogStateOpened(true);
  };

  const onDeleteButtonClick = (dashboard: DashboardResource) => {
    setTargetedDashboard(dashboard);
    setDeleteDashboardDialogStateOpened(true);
  };

  return (
    <Box>
      <List>
        {dashboardList.map((dashboard, i) => {
          return (
            <Fragment key={dashboard.metadata.name}>
              {i !== 0 && <Divider key={`divider-${i}`} />}
              <ListItem
                disablePadding
                sx={{ backgroundColor: (theme) => theme.palette.primary.main + '10' }}
                key={`list-item-${i}`}
                secondaryAction={
                  <List>
                    <ListItem>
                      <IconButton
                        edge="start"
                        aria-label="rename"
                        onClick={() => onRenameButtonClick(dashboard)}
                        disabled={isRenameDashboardDialogStateOpened || isDeleteDashboardDialogStateOpened}
                      >
                        <PencilIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => onDeleteButtonClick(dashboard)}
                        disabled={isRenameDashboardDialogStateOpened || isDeleteDashboardDialogStateOpened}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItem>
                  </List>
                }
              >
                <ListItemButton
                  onClick={() =>
                    navigate(`/projects/${dashboard.metadata.project}/dashboards/${dashboard.metadata.name}`)
                  }
                >
                  <ListItemText primary={dashboardDisplayName(dashboard)} />
                </ListItemButton>
              </ListItem>
            </Fragment>
          );
        })}
      </List>
      {targetedDashboard && (
        <Box>
          <RenameDashboardDialog
            open={isRenameDashboardDialogStateOpened}
            onClose={() => setRenameDashboardDialogStateOpened(false)}
            dashboard={targetedDashboard}
          />
          <DeleteDashboardDialog
            open={isDeleteDashboardDialogStateOpened}
            onClose={() => setDeleteDashboardDialogStateOpened(false)}
            dashboard={targetedDashboard}
          />
        </Box>
      )}
    </Box>
  );
}

export default DashboardList;
