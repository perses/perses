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

import { Box, Stack } from '@mui/material';
import { ReactNode, SyntheticEvent, useCallback, useState } from 'react';
import ViewDashboardIcon from 'mdi-material-ui/ViewDashboard';
import CodeJsonIcon from 'mdi-material-ui/CodeJson';
import DatabaseIcon from 'mdi-material-ui/Database';
import ShieldIcon from 'mdi-material-ui/Shield';
import ShieldAccountIcon from 'mdi-material-ui/ShieldAccount';
import KeyIcon from 'mdi-material-ui/Key';
import {
  getDatasourceDisplayName,
  getVariableExtendedDisplayName,
  DashboardSelector,
  ProjectDatasource,
  VariableResource,
  RoleResource,
  RoleBindingResource,
} from '@perses-dev/core';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '@perses-dev/components';
import { CRUDButton } from '../../components/CRUDButton/CRUDButton';
import { CreateDashboardDialog } from '../../components/dialogs';
import { VariableDrawer } from '../../components/variable/VariableDrawer';
import { DatasourceDrawer } from '../../components/datasource/DatasourceDrawer';
import { useCreateDatasourceMutation } from '../../model/datasource-client';
import { useCreateVariableMutation } from '../../model/variable-client';
import { useIsReadonly } from '../../context/Config';
import { MenuTab, MenuTabs } from '../../components/tabs';
import { useCreateRoleBindingMutation } from '../../model/rolebinding-client';
import { useCreateRoleMutation } from '../../model/role-client';
import { RoleDrawer } from '../../components/roles/RoleDrawer';
import { RoleBindingDrawer } from '../../components/rolebindings/RoleBindingDrawer';
import { ProjectDashboards } from './tabs/ProjectDashboards';
import { ProjectVariables } from './tabs/ProjectVariables';
import { ProjectDatasources } from './tabs/ProjectDatasources';
import { ProjectSecrets } from './tabs/ProjectSecrets';
import { ProjectRoles } from './tabs/ProjectRoles';
import { ProjectRoleBindings } from './tabs/ProjectRoleBindings';

const dashboardsTabIndex = 'dashboards';
const datasourcesTabIndex = 'datasources';
const rolesTabIndex = 'roles';
const roleBindingsTabIndex = 'rolesbindings';
const secretsTabIndex = 'secrets';
const variablesTabIndex = 'variables';

interface TabButtonProps {
  index: string;
  projectName: string;
}

function TabButton(props: TabButtonProps) {
  const navigate = useNavigate();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();

  const createDatasourceMutation = useCreateDatasourceMutation(props.projectName);
  const createRoleMutation = useCreateRoleMutation(props.projectName);
  const createRoleBindingMutation = useCreateRoleBindingMutation(props.projectName);
  const createVariableMutation = useCreateVariableMutation(props.projectName);

  const [isCreateDashboardDialogOpened, setCreateDashboardDialogOpened] = useState(false);
  const [isDatasourceDrawerOpened, setDatasourceDrawerOpened] = useState(false);
  const [isRoleDrawerOpened, setRoleDrawerOpened] = useState(false);
  const [isRoleBindingDrawerOpened, setRoleBindingDrawerOpened] = useState(false);
  const [isVariableDrawerOpened, setVariableDrawerOpened] = useState(false);

  const isReadonly = useIsReadonly();

  const handleDashboardCreation = (dashboardSelector: DashboardSelector) => {
    navigate(`/projects/${dashboardSelector.project}/dashboard/new`, { state: dashboardSelector.dashboard });
  };

  const handleVariableCreation = useCallback(
    (variable: VariableResource) => {
      createVariableMutation.mutate(variable, {
        onSuccess: (updatedVariable: VariableResource) => {
          successSnackbar(`Variable ${getVariableExtendedDisplayName(updatedVariable)} has been successfully created`);
          setVariableDrawerOpened(false);
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
    (datasource: ProjectDatasource) => {
      createDatasourceMutation.mutate(datasource, {
        onSuccess: (createdDatasource: ProjectDatasource) => {
          successSnackbar(`Datasource ${getDatasourceDisplayName(createdDatasource)} has been successfully created`);
          setDatasourceDrawerOpened(false);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, createDatasourceMutation]
  );

  const handleRoleCreation = useCallback(
    (role: RoleResource) => {
      createRoleMutation.mutate(role, {
        onSuccess: (createdRole: RoleResource) => {
          successSnackbar(`Role ${createdRole} has been successfully created`);
          setRoleDrawerOpened(false);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, createRoleMutation]
  );

  const handleRoleBindingCreation = useCallback(
    (roleBinding: RoleBindingResource) => {
      createRoleBindingMutation.mutate(roleBinding, {
        onSuccess: (createdRoleBinding: RoleBindingResource) => {
          successSnackbar(`RoleBinding ${createdRoleBinding} has been successfully created`);
          setRoleBindingDrawerOpened(false);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, createRoleBindingMutation]
  );

  switch (props.index) {
    case dashboardsTabIndex:
      return (
        <>
          <CRUDButton text="Add Dashboard" variant="contained" onClick={() => setCreateDashboardDialogOpened(true)} />
          <CreateDashboardDialog
            open={isCreateDashboardDialogOpened}
            projectOptions={[props.projectName]}
            hideProjectSelect={true}
            onClose={() => setCreateDashboardDialogOpened(false)}
            onSuccess={handleDashboardCreation}
          />
        </>
      );
    case variablesTabIndex:
      return (
        <>
          <CRUDButton text="Add Variable" variant="contained" onClick={() => setVariableDrawerOpened(true)} />
          <VariableDrawer
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
            isOpen={isVariableDrawerOpened}
            action="create"
            isReadonly={isReadonly}
            onSave={handleVariableCreation}
            onClose={() => setVariableDrawerOpened(false)}
          />
        </>
      );
    case datasourcesTabIndex:
      return (
        <>
          <CRUDButton text="Add Datasource" variant="contained" onClick={() => setDatasourceDrawerOpened(true)} />
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
            isOpen={isDatasourceDrawerOpened}
            action="create"
            isReadonly={isReadonly}
            onSave={handleDatasourceCreation}
            onClose={() => setDatasourceDrawerOpened(false)}
          />
        </>
      );
    case rolesTabIndex:
      return (
        <>
          <CRUDButton text="Add Role" variant="contained" onClick={() => setRoleDrawerOpened(true)} />
          <RoleDrawer
            role={{
              kind: 'Role',
              metadata: {
                name: 'NewRole',
                project: props.projectName,
              },
              spec: {
                permissions: [],
              },
            }}
            isOpen={isRoleDrawerOpened}
            action="create"
            isReadonly={isReadonly}
            onSave={handleRoleCreation}
            onClose={() => setRoleDrawerOpened(false)}
          />
        </>
      );
    case roleBindingsTabIndex:
      return (
        <>
          <CRUDButton text="Add Role Binding" variant="contained" onClick={() => setRoleBindingDrawerOpened(true)} />
          <RoleBindingDrawer
            roleBinding={{
              kind: 'RoleBinding',
              metadata: {
                name: 'NewRoleBinding',
                project: props.projectName,
              },
              spec: {
                role: '',
                subjects: [],
              },
            }}
            isOpen={isRoleBindingDrawerOpened}
            action="create"
            isReadonly={isReadonly}
            onSave={handleRoleBindingCreation}
            onClose={() => setRoleBindingDrawerOpened(false)}
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

  const [value, setValue] = useState((initialTab ?? dashboardsTabIndex).toLowerCase());

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
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <MenuTabs value={value} onChange={handleChange} aria-label="Project tabs">
          <MenuTab
            label="Dashboards"
            icon={<ViewDashboardIcon />}
            iconPosition="start"
            {...a11yProps(dashboardsTabIndex)}
            value={dashboardsTabIndex}
          />
          <MenuTab
            label="Variables"
            icon={<CodeJsonIcon />}
            iconPosition="start"
            {...a11yProps(variablesTabIndex)}
            value={variablesTabIndex}
          />
          <MenuTab
            label="Datasources"
            icon={<DatabaseIcon />}
            iconPosition="start"
            {...a11yProps(datasourcesTabIndex)}
            value={datasourcesTabIndex}
          />
          <MenuTab
            label="Secrets"
            icon={<KeyIcon />}
            iconPosition="start"
            {...a11yProps(secretsTabIndex)}
            value={secretsTabIndex}
          />
          <MenuTab
            label="Roles"
            icon={<ShieldIcon />}
            iconPosition="start"
            {...a11yProps(rolesTabIndex)}
            value={rolesTabIndex}
          />
          <MenuTab
            label="Role Bindings"
            icon={<ShieldAccountIcon />}
            iconPosition="start"
            {...a11yProps(roleBindingsTabIndex)}
            value={roleBindingsTabIndex}
          />
        </MenuTabs>
        <TabButton index={value} projectName={projectName} />
      </Stack>
      <TabPanel value={value} index={dashboardsTabIndex}>
        <ProjectDashboards projectName={projectName} id="main-dashboard-list" />
      </TabPanel>
      <TabPanel value={value} index={variablesTabIndex}>
        <ProjectVariables projectName={projectName} id="project-variable-list" />
      </TabPanel>
      <TabPanel value={value} index={datasourcesTabIndex}>
        <ProjectDatasources projectName={projectName} id="project-datasource-list" />
      </TabPanel>
      <TabPanel value={value} index={secretsTabIndex}>
        <ProjectSecrets projectName={projectName} id="project-secret-list" />
      </TabPanel>
      <TabPanel value={value} index={rolesTabIndex}>
        <ProjectRoles projectName={projectName} id="project-role-list" />
      </TabPanel>
      <TabPanel value={value} index={roleBindingsTabIndex}>
        <ProjectRoleBindings projectName={projectName} id="project-rolebinding-list" />
      </TabPanel>
    </Box>
  );
}
