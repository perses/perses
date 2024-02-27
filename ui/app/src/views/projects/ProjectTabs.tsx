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

import { Box, BoxProps, Stack } from '@mui/material';
import { SyntheticEvent, useCallback, useMemo, useState } from 'react';
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
  SecretResource,
  EphemeralDashboardSelector,
} from '@perses-dev/core';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from '@perses-dev/components';
import { CRUDButton, CRUDButtonProps } from '../../components/CRUDButton/CRUDButton';
import { CreateDashboardDialog, CreateEphemeralDashboardDialog } from '../../components/dialogs';
import { VariableDrawer } from '../../components/variable/VariableDrawer';
import { DatasourceDrawer } from '../../components/datasource/DatasourceDrawer';
import { useCreateDatasourceMutation } from '../../model/datasource-client';
import { useCreateVariableMutation } from '../../model/variable-client';
import { useIsAuthEnable, useIsReadonly } from '../../context/Config';
import { MenuTab, MenuTabs } from '../../components/tabs';
import { useCreateRoleBindingMutation } from '../../model/rolebinding-client';
import { useCreateRoleMutation, useRoleList } from '../../model/role-client';
import { RoleDrawer } from '../../components/roles/RoleDrawer';
import { RoleBindingDrawer } from '../../components/rolebindings/RoleBindingDrawer';
import { useIsMobileSize } from '../../utils/browser-size';
import { SecretDrawer } from '../../components/secrets/SecretDrawer';
import { useCreateSecretMutation } from '../../model/secret-client';
import { useEphemeralDashboardList } from '../../model/ephemeral-dashboard-client';
import { ProjectDashboards } from './tabs/ProjectDashboards';
import { ProjectEphemeralDashboards } from './tabs/ProjectEphemeralDashboards';
import { ProjectVariables } from './tabs/ProjectVariables';
import { ProjectDatasources } from './tabs/ProjectDatasources';
import { ProjectSecrets } from './tabs/ProjectSecrets';
import { ProjectRoles } from './tabs/ProjectRoles';
import { ProjectRoleBindings } from './tabs/ProjectRoleBindings';

const dashboardsTabIndex = 'dashboards';
const ephemeralDashboardsTabIndex = 'ephemeraldashboards';
const datasourcesTabIndex = 'datasources';
const rolesTabIndex = 'roles';
const roleBindingsTabIndex = 'rolesbindings';
const secretsTabIndex = 'secrets';
const variablesTabIndex = 'variables';

interface TabButtonProps extends CRUDButtonProps {
  index: string;
  projectName: string;
}

function TabButton({ index, projectName, ...props }: TabButtonProps) {
  const navigate = useNavigate();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();

  const createDatasourceMutation = useCreateDatasourceMutation(projectName);
  const createRoleMutation = useCreateRoleMutation(projectName);
  const createRoleBindingMutation = useCreateRoleBindingMutation(projectName);
  const createSecretMutation = useCreateSecretMutation(projectName);
  const createVariableMutation = useCreateVariableMutation(projectName);

  const [isCreateDashboardDialogOpened, setCreateDashboardDialogOpened] = useState(false);
  const [isCreateEphemeralDashboardDialogOpened, setCreateEphemeralDashboardDialogOpened] = useState(false);
  const [isDatasourceDrawerOpened, setDatasourceDrawerOpened] = useState(false);
  const [isRoleDrawerOpened, setRoleDrawerOpened] = useState(false);
  const [isRoleBindingDrawerOpened, setRoleBindingDrawerOpened] = useState(false);
  const [isSecretDrawerOpened, setSecretDrawerOpened] = useState(false);
  const [isVariableDrawerOpened, setVariableDrawerOpened] = useState(false);

  const isReadonly = useIsReadonly();

  const handleDashboardCreation = (dashboardSelector: DashboardSelector) => {
    navigate(`/projects/${dashboardSelector.project}/dashboard/new`, { state: dashboardSelector.dashboard });
  };

  const handleEphemeralDashboardCreation = (dashboardSelector: EphemeralDashboardSelector) => {
    navigate(`/projects/${dashboardSelector.project}/ephemeraldashboard/new`, {
      state: { name: dashboardSelector.dashboard, ttl: dashboardSelector.ttl },
    });
  };

  const { data } = useRoleList(projectName);
  const roleSuggestions = useMemo(() => {
    return (data ?? []).map((role) => role.metadata.name);
  }, [data]);

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
          successSnackbar(`Role ${createdRole.metadata.name} has been successfully created`);
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
          successSnackbar(`RoleBinding ${createdRoleBinding.metadata.name} has been successfully created`);
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

  const handleSecretCreation = useCallback(
    (secret: SecretResource) => {
      createSecretMutation.mutate(secret, {
        onSuccess: (createdSecret: SecretResource) => {
          successSnackbar(`Secret ${createdSecret.metadata.name} has been successfully created`);
          setSecretDrawerOpened(false);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, createSecretMutation]
  );

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

  switch (index) {
    case dashboardsTabIndex:
      return (
        <>
          <CRUDButton
            action="create"
            scope="Dashboard"
            project={projectName}
            variant="contained"
            onClick={() => setCreateDashboardDialogOpened(true)}
            {...props}
          >
            Add Dashboard
          </CRUDButton>
          <CreateDashboardDialog
            open={isCreateDashboardDialogOpened}
            projectOptions={[projectName]}
            hideProjectSelect={true}
            onClose={() => setCreateDashboardDialogOpened(false)}
            onSuccess={handleDashboardCreation}
          />
        </>
      );
    case ephemeralDashboardsTabIndex:
      return (
        <>
          <CRUDButton
            action="create"
            scope="EphemeralDashboard"
            project={projectName}
            variant="contained"
            onClick={() => setCreateEphemeralDashboardDialogOpened(true)}
            {...props}
          >
            Add Dashboard
          </CRUDButton>
          <CreateEphemeralDashboardDialog
            open={isCreateEphemeralDashboardDialogOpened}
            projectOptions={[projectName]}
            onClose={() => setCreateEphemeralDashboardDialogOpened(false)}
            onSuccess={handleEphemeralDashboardCreation}
          />
        </>
      );
    case datasourcesTabIndex:
      return (
        <>
          <CRUDButton
            action="create"
            scope="Datasource"
            project={projectName}
            variant="contained"
            onClick={() => setDatasourceDrawerOpened(true)}
            {...props}
          >
            Add Datasource
          </CRUDButton>
          <DatasourceDrawer
            datasource={{
              kind: 'Datasource',
              metadata: {
                name: 'NewDatasource',
                project: projectName,
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
          <CRUDButton
            action="create"
            scope="Role"
            project={projectName}
            variant="contained"
            onClick={() => setRoleDrawerOpened(true)}
            {...props}
          >
            Add Role
          </CRUDButton>
          <RoleDrawer
            role={{
              kind: 'Role',
              metadata: {
                name: 'NewRole',
                project: projectName,
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
          <CRUDButton
            action="create"
            scope="RoleBinding"
            project={projectName}
            variant="contained"
            onClick={() => setRoleBindingDrawerOpened(true)}
            {...props}
          >
            Add Role Binding
          </CRUDButton>
          <RoleBindingDrawer
            roleBinding={{
              kind: 'RoleBinding',
              metadata: {
                name: 'NewRoleBinding',
                project: projectName,
              },
              spec: {
                role: '',
                subjects: [],
              },
            }}
            roleSuggestions={roleSuggestions}
            isOpen={isRoleBindingDrawerOpened}
            action="create"
            isReadonly={isReadonly}
            onSave={handleRoleBindingCreation}
            onClose={() => setRoleBindingDrawerOpened(false)}
          />
        </>
      );
    case secretsTabIndex:
      return (
        <>
          <CRUDButton
            action="create"
            scope="Secret"
            project={projectName}
            variant="contained"
            onClick={() => setSecretDrawerOpened(true)}
            {...props}
          >
            Add Secret
          </CRUDButton>
          <SecretDrawer
            secret={{
              kind: 'Secret',
              metadata: {
                name: 'NewSecret',
                project: projectName,
              },
              spec: {
                basicAuth: {
                  username: '',
                  password: '',
                  passwordFile: '',
                },
              },
            }}
            isOpen={isSecretDrawerOpened}
            action="create"
            isReadonly={isReadonly}
            onSave={handleSecretCreation}
            onClose={() => setSecretDrawerOpened(false)}
          />
        </>
      );
    case variablesTabIndex:
      return (
        <>
          <CRUDButton
            action="create"
            scope="Variable"
            project={projectName}
            variant="contained"
            onClick={() => setVariableDrawerOpened(true)}
            {...props}
          >
            Add Variable
          </CRUDButton>
          <VariableDrawer
            variable={{
              kind: 'Variable',
              metadata: {
                name: 'NewVariable',
                project: projectName,
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
    default:
      return <></>;
  }
}

interface TabPanelProps extends BoxProps {
  index: string;
  value: string;
}

function TabPanel({ children, value, index, ...props }: TabPanelProps) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...props}
    >
      {value === index && children}
    </Box>
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
  const { tab } = useParams();
  const isAuthEnable = useIsAuthEnable();

  const navigate = useNavigate();
  const isMobileSize = useIsMobileSize();
  const hasEphemeralDashboards = (useEphemeralDashboardList(projectName).data ?? []).length > 0;

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
        <MenuTabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Project tabs"
        >
          <MenuTab
            label="Dashboards"
            icon={<ViewDashboardIcon />}
            iconPosition="start"
            {...a11yProps(dashboardsTabIndex)}
            value={dashboardsTabIndex}
          />
          {(hasEphemeralDashboards || tab == 'ephemeraldashboards') && (
            <MenuTab
              label="Ephemeral Dashboards"
              icon={<ViewDashboardIcon />}
              iconPosition="start"
              {...a11yProps(ephemeralDashboardsTabIndex)}
              value={ephemeralDashboardsTabIndex}
            />
          )}
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
            disabled={!isAuthEnable}
          />
          <MenuTab
            label="Role Bindings"
            icon={<ShieldAccountIcon />}
            iconPosition="start"
            {...a11yProps(roleBindingsTabIndex)}
            value={roleBindingsTabIndex}
            disabled={!isAuthEnable}
          />
        </MenuTabs>
        {!isMobileSize && <TabButton index={value} projectName={projectName} />}
      </Stack>
      {isMobileSize && <TabButton index={value} projectName={projectName} fullWidth sx={{ marginTop: 0.5 }} />}
      <TabPanel value={value} index={dashboardsTabIndex} sx={{ marginTop: isMobileSize ? 1 : 2 }}>
        <ProjectDashboards projectName={projectName} id="main-dashboard-list" />
      </TabPanel>
      {hasEphemeralDashboards && (
        <TabPanel value={value} index={ephemeralDashboardsTabIndex} sx={{ marginTop: isMobileSize ? 1 : 2 }}>
          <ProjectEphemeralDashboards projectName={projectName} id="project-ephemeral-dashboard-list" />
        </TabPanel>
      )}
      <TabPanel value={value} index={variablesTabIndex} sx={{ marginTop: isMobileSize ? 1 : 2 }}>
        <ProjectVariables projectName={projectName} id="project-variable-list" />
      </TabPanel>
      <TabPanel value={value} index={datasourcesTabIndex} sx={{ marginTop: isMobileSize ? 1 : 2 }}>
        <ProjectDatasources projectName={projectName} id="project-datasource-list" />
      </TabPanel>
      <TabPanel value={value} index={secretsTabIndex} sx={{ marginTop: isMobileSize ? 1 : 2 }}>
        <ProjectSecrets projectName={projectName} id="project-secret-list" />
      </TabPanel>
      {isAuthEnable && (
        <>
          <TabPanel value={value} index={rolesTabIndex} sx={{ marginTop: isMobileSize ? 1 : 2 }}>
            <ProjectRoles projectName={projectName} id="project-role-list" />
          </TabPanel>
          <TabPanel value={value} index={roleBindingsTabIndex} sx={{ marginTop: isMobileSize ? 1 : 2 }}>
            <ProjectRoleBindings projectName={projectName} id="project-rolebinding-list" />
          </TabPanel>
        </>
      )}
    </Box>
  );
}
