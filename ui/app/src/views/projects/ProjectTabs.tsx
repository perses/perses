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

import { Box, Stack, Tab, Tabs } from '@mui/material';
import { ReactNode, SyntheticEvent, useCallback, useState } from 'react';
import ViewDashboardIcon from 'mdi-material-ui/ViewDashboard';
import CodeJsonIcon from 'mdi-material-ui/CodeJson';
import DatabaseIcon from 'mdi-material-ui/Database';
import {
  getDatasourceDisplayName,
  getVariableExtendedDisplayName,
  DashboardSelector,
  Datasource,
  VariableResource,
} from '@perses-dev/core';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '@perses-dev/components';
import { CRUDButton } from '../../components/CRUDButton/CRUDButton';
import { CreateDashboardDialog } from '../../components/dialogs';
import { VariableFormDrawer } from '../../components/VariableList/VariableFormDrawer';
import { useCreateVariableMutation, useCreateDatasourceMutation } from '../../model/project-client';
import { DatasourceDrawer } from '../../components/DatasourceList/DatasourceDrawer';
import { ProjectDashboards } from './tabs/ProjectDashboards';
import { ProjectVariables } from './tabs/ProjectVariables';
import { ProjectDatasources } from './tabs/ProjectDatasources';

const dashboardTabIndex = 'dashboards';
const variablesTabIndex = 'variables';
const datasourcesTabIndex = 'datasources';

interface TabButtonProps {
  index: string;
  projectName: string;
}

function TabButton(props: TabButtonProps) {
  const navigate = useNavigate();
  const createVariableMutation = useCreateVariableMutation(props.projectName);
  const createDatasourceMutation = useCreateDatasourceMutation(props.projectName);
  const { successSnackbar, exceptionSnackbar } = useSnackbar();

  const [openCreateDashboardDialogState, setOpenCreateDashboardDialogState] = useState(false);
  const [openCreateVariableDrawerState, setOpenCreateVariableDrawerState] = useState(false);
  const [isCreateDatasourceDrawerStateOpened, setCreateDatasourceFormStateOpened] = useState(false);

  const handleDashboardCreation = (dashboardSelector: DashboardSelector) => {
    navigate(`/projects/${dashboardSelector.project}/dashboards/${dashboardSelector.dashboard}/create`);
  };

  const handleVariableCreation = useCallback(
    (variable: VariableResource) => {
      createVariableMutation.mutate(variable, {
        onSuccess: (updatedVariable: VariableResource) => {
          successSnackbar(`Variable ${getVariableExtendedDisplayName(updatedVariable)} have been successfully created`);
          setOpenCreateVariableDrawerState(false);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, createVariableMutation]
  );

  const handleDatasourceCreation = useCallback(
    (datasource: Datasource) => {
      createDatasourceMutation.mutate(datasource, {
        onSuccess: (createdDatasource: Datasource) => {
          successSnackbar(`Datasource ${getDatasourceDisplayName(createdDatasource)} has been successfully created`);
          setCreateDatasourceFormStateOpened(false);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, createDatasourceMutation]
  );

  switch (props.index) {
    case dashboardTabIndex:
      return (
        <>
          <CRUDButton
            text="Add Dashboard"
            variant="contained"
            onClick={() => setOpenCreateDashboardDialogState(true)}
          />
          <CreateDashboardDialog
            open={openCreateDashboardDialogState}
            projectOptions={[props.projectName]}
            onClose={() => setOpenCreateDashboardDialogState(false)}
            onSuccess={handleDashboardCreation}
          />
        </>
      );
    case variablesTabIndex:
      return (
        <>
          <CRUDButton text="Add Variable" variant="contained" onClick={() => setOpenCreateVariableDrawerState(true)} />
          <VariableFormDrawer
            variable={{
              kind: 'Variable',
              metadata: {
                name: 'NewVariable',
                project: props.projectName,
              },
              spec: {
                kind: 'TextVariable',
                spec: {
                  name: 'NewVariable',
                  value: '',
                },
              },
            }}
            isOpen={openCreateVariableDrawerState}
            onChange={handleVariableCreation}
            onClose={() => setOpenCreateVariableDrawerState(false)}
            action="create"
          />
        </>
      );
    case datasourcesTabIndex:
      return (
        <>
          <CRUDButton
            text="Add Datasource"
            variant="contained"
            onClick={() => setCreateDatasourceFormStateOpened(true)}
          />
          <DatasourceDrawer
            datasource={{
              kind: 'Datasource',
              metadata: {
                name: 'NewDatasource',
                project: props.projectName,
              },
              spec: {
                default: false,
                plugin: {
                  // TODO: find a way to avoid assuming that the PrometheusDatasource plugin is installed
                  kind: 'PrometheusDatasource',
                  spec: {},
                },
              },
            }}
            isOpen={isCreateDatasourceDrawerStateOpened}
            saveActionStr="Create"
            onSave={handleDatasourceCreation}
            onClose={() => setCreateDatasourceFormStateOpened(false)}
          />
        </>
      );
    default:
      return <></>;
  }
}

interface TabPanelProps {
  children?: ReactNode;
  index: string;
  value: string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ paddingTop: 2 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: string) {
  return {
    id: `project-tab-${index}`,
    'aria-controls': `project-tabpanel-${index}`,
  };
}

interface DashboardVariableTabsProps {
  projectName: string;
  initialTab?: string;
}

export function ProjectTabs(props: DashboardVariableTabsProps) {
  const { projectName, initialTab } = props;

  const navigate = useNavigate();

  const [value, setValue] = useState((initialTab ?? dashboardTabIndex).toLowerCase());

  const handleChange = (event: SyntheticEvent, newTabIndex: string) => {
    setValue(newTabIndex);
    navigate(`/projects/${projectName}/${newTabIndex}`);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ marginLeft: 2.5, marginRight: 2.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab
            label="Dashboards"
            icon={<ViewDashboardIcon />}
            iconPosition="start"
            {...a11yProps(dashboardTabIndex)}
            value={dashboardTabIndex}
          />
          <Tab
            label="Variables"
            icon={<CodeJsonIcon />}
            iconPosition="start"
            {...a11yProps(variablesTabIndex)}
            value={variablesTabIndex}
          />
          <Tab
            label="Datasources"
            icon={<DatabaseIcon />}
            iconPosition="start"
            {...a11yProps(datasourcesTabIndex)}
            value={datasourcesTabIndex}
          />
        </Tabs>
        <TabButton index={value} projectName={projectName} />
      </Stack>
      <TabPanel value={value} index="dashboards">
        <ProjectDashboards projectName={projectName} id="main-dashboard-list" />
      </TabPanel>
      <TabPanel value={value} index="variables">
        <ProjectVariables projectName={projectName} id="project-variable-list" />
      </TabPanel>
      <TabPanel value={value} index="datasources">
        <ProjectDatasources projectName={projectName} id="project-datasource-list" />
      </TabPanel>
    </Box>
  );
}
