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
import { ReactElement, SyntheticEvent, useCallback, useMemo, useState } from 'react';
import CodeJsonIcon from 'mdi-material-ui/CodeJson';
import DatabaseIcon from 'mdi-material-ui/Database';
import KeyIcon from 'mdi-material-ui/Key';
import {
  getResourceDisplayName,
  GlobalDatasourceResource,
  getResourceExtendedDisplayName,
  GlobalVariableResource,
  GlobalRoleResource,
  GlobalRoleBindingResource,
  GlobalSecretResource,
} from '@perses-dev/core';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '@perses-dev/components';
import ShieldAccountIcon from 'mdi-material-ui/ShieldAccount';
import ShieldIcon from 'mdi-material-ui/Shield';
import AccountIcon from 'mdi-material-ui/Account';
import { CRUDButton, CRUDButtonProps } from '../../components/CRUDButton/CRUDButton';
import { VariableDrawer } from '../../components/variable/VariableDrawer';
import { useCreateGlobalVariableMutation } from '../../model/global-variable-client';
import { useCreateGlobalDatasourceMutation } from '../../model/admin-client';
import { DatasourceDrawer } from '../../components/datasource/DatasourceDrawer';
import {
  useIsAuthEnabled,
  useIsGlobalDatasourceEnabled,
  useIsGlobalVariableEnabled,
  useIsReadonly,
} from '../../context/Config';
import { MenuTab, MenuTabs } from '../../components/tabs';
import { useCreateGlobalRoleBindingMutation } from '../../model/global-rolebinding-client';
import { useCreateGlobalRoleMutation, useGlobalRoleList } from '../../model/global-role-client';
import { RoleDrawer } from '../../components/roles/RoleDrawer';
import { RoleBindingDrawer } from '../../components/rolebindings/RoleBindingDrawer';
import { GlobalProject, useHasPermission } from '../../context/Authorization';
import { useIsMobileSize } from '../../utils/browser-size';
import { useCreateGlobalSecretMutation } from '../../model/global-secret-client';
import { SecretDrawer } from '../../components/secrets/SecretDrawer';
import { GlobalVariables } from './tabs/GlobalVariables';
import { GlobalDatasources } from './tabs/GlobalDatasources';
import { GlobalSecrets } from './tabs/GlobalSecrets';
import { GlobalRoles } from './tabs/GlobalRoles';
import { GlobalRoleBindings } from './tabs/GlobalRoleBindings';
import { Users } from './tabs/Users';

const datasourcesTabIndex = 'datasources';
const rolesTabIndex = 'roles';
const roleBindingsTabIndex = 'rolesbindings';
const secretsTabIndex = 'secrets';
const usersTabIndex = 'users';
const variablesTabIndex = 'variables';

interface TabButtonProps extends CRUDButtonProps {
  index: string;
}

function TabButton({ index, ...props }: TabButtonProps): ReactElement {
  const createGlobalDatasourceMutation = useCreateGlobalDatasourceMutation();
  const createGlobalRoleMutation = useCreateGlobalRoleMutation();
  const createGlobalRoleBindingMutation = useCreateGlobalRoleBindingMutation();
  const createGlobalSecretMutation = useCreateGlobalSecretMutation();
  const createGlobalVariableMutation = useCreateGlobalVariableMutation();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();

  const [isDatasourceDrawerOpened, setDatasourceDrawerOpened] = useState(false);
  const [isRoleDrawerOpened, setRoleDrawerOpened] = useState(false);
  const [isRoleBindingDrawerOpened, setRoleBindingDrawerOpened] = useState(false);
  const [isSecretDrawerOpened, setSecretDrawerOpened] = useState(false);
  const [isVariableDrawerOpened, setVariableDrawerOpened] = useState(false);
  const isReadonly = useIsReadonly();

  const { data } = useGlobalRoleList();
  const roleSuggestions = useMemo(() => {
    return (data ?? []).map((role) => role.metadata.name);
  }, [data]);

  const handleGlobalDatasourceCreation = useCallback(
    (datasource: GlobalDatasourceResource) => {
      createGlobalDatasourceMutation.mutate(datasource, {
        onSuccess: (createdDatasource: GlobalDatasourceResource) => {
          successSnackbar(`Datasource ${getResourceDisplayName(createdDatasource)} has been successfully created`);
          setDatasourceDrawerOpened(false);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, createGlobalDatasourceMutation]
  );

  const handleGlobalRoleCreation = useCallback(
    (role: GlobalRoleResource) => {
      createGlobalRoleMutation.mutate(role, {
        onSuccess: (createdRole: GlobalRoleResource) => {
          successSnackbar(`GlobalRole ${createdRole.metadata.name} has been successfully created`);
          setRoleDrawerOpened(false);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, createGlobalRoleMutation]
  );

  const handleGlobalRoleBindingCreation = useCallback(
    (roleBinding: GlobalRoleBindingResource) => {
      createGlobalRoleBindingMutation.mutate(roleBinding, {
        onSuccess: (createdRoleBinding: GlobalRoleBindingResource) => {
          successSnackbar(`GlobalRoleBinding ${createdRoleBinding.metadata.name} has been successfully created`);
          setRoleBindingDrawerOpened(false);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, createGlobalRoleBindingMutation]
  );

  const handleGlobalSecretCreation = useCallback(
    (secret: GlobalSecretResource) => {
      createGlobalSecretMutation.mutate(secret, {
        onSuccess: (updatedSecret: GlobalSecretResource) => {
          successSnackbar(`Global Secret ${updatedSecret.metadata.name} has been successfully created`);
          setSecretDrawerOpened(false);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, createGlobalSecretMutation]
  );

  const handleGlobalVariableCreation = useCallback(
    (variable: GlobalVariableResource) => {
      createGlobalVariableMutation.mutate(variable, {
        onSuccess: (updatedVariable: GlobalVariableResource) => {
          successSnackbar(
            `Global Variable ${getResourceExtendedDisplayName(updatedVariable)} has been successfully created`
          );
          setVariableDrawerOpened(false);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, createGlobalVariableMutation]
  );

  switch (index) {
    case datasourcesTabIndex:
      return (
        <>
          <CRUDButton
            action="create"
            scope="GlobalDatasource"
            project={GlobalProject}
            variant="contained"
            onClick={() => setDatasourceDrawerOpened(true)}
            {...props}
          >
            Add Global Datasource
          </CRUDButton>
          <DatasourceDrawer
            datasource={{
              kind: 'GlobalDatasource',
              metadata: {
                name: 'NewDatasource',
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
            onSave={handleGlobalDatasourceCreation}
            onClose={() => setDatasourceDrawerOpened(false)}
          />
        </>
      );
    case rolesTabIndex:
      return (
        <>
          <CRUDButton
            action="create"
            scope="GlobalRole"
            project={GlobalProject}
            variant="contained"
            onClick={() => setRoleDrawerOpened(true)}
            {...props}
          >
            Add Global Role
          </CRUDButton>
          <RoleDrawer
            role={{
              kind: 'GlobalRole',
              metadata: {
                name: 'NewRole',
              },
              spec: {
                permissions: [],
              },
            }}
            isOpen={isRoleDrawerOpened}
            action="create"
            isReadonly={isReadonly}
            onSave={handleGlobalRoleCreation}
            onClose={() => setRoleDrawerOpened(false)}
          />
        </>
      );
    case roleBindingsTabIndex:
      return (
        <>
          <CRUDButton
            action="create"
            scope="GlobalRoleBinding"
            project={GlobalProject}
            variant="contained"
            onClick={() => setRoleBindingDrawerOpened(true)}
            {...props}
          >
            Add Global Role Binding
          </CRUDButton>
          <RoleBindingDrawer
            roleBinding={{
              kind: 'GlobalRoleBinding',
              metadata: {
                name: 'NewRoleBinding',
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
            onSave={handleGlobalRoleBindingCreation}
            onClose={() => setRoleBindingDrawerOpened(false)}
          />
        </>
      );
    case secretsTabIndex:
      return (
        <>
          <CRUDButton
            action="create"
            scope="GlobalSecret"
            project={GlobalProject}
            variant="contained"
            onClick={() => setSecretDrawerOpened(true)}
            {...props}
          >
            Add Global Secret
          </CRUDButton>
          <SecretDrawer
            secret={{
              kind: 'GlobalSecret',
              metadata: {
                name: 'NewSecret',
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
            onSave={handleGlobalSecretCreation}
            onClose={() => setSecretDrawerOpened(false)}
            {...props}
          />
        </>
      );
    case variablesTabIndex:
      return (
        <>
          <CRUDButton
            action="create"
            scope="GlobalVariable"
            project={GlobalProject}
            variant="contained"
            onClick={() => setVariableDrawerOpened(true)}
            {...props}
          >
            Add Global Variable
          </CRUDButton>
          <VariableDrawer
            variable={{
              kind: 'GlobalVariable',
              metadata: {
                name: 'NewVariable',
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
            onSave={handleGlobalVariableCreation}
            onClose={() => setVariableDrawerOpened(false)}
            {...props}
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

function TabPanel({ children, value, index, ...props }: TabPanelProps): ReactElement {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...props}
    >
      {value === index && children}
    </Box>
  );
}

function a11yProps(index: string): Record<string, unknown> {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

interface AdminTabsProps {
  initialTab?: string;
}

export function AdminTabs(props: AdminTabsProps): ReactElement {
  const { initialTab } = props;
  const isAuthEnabled = useIsAuthEnabled();
  const isGlobalDatasourceEnabled = useIsGlobalDatasourceEnabled();
  const isGlobalVariableEnabled = useIsGlobalVariableEnabled();

  const navigate = useNavigate();
  const isMobileSize = useIsMobileSize();

  const [value, setValue] = useState((initialTab ?? variablesTabIndex).toLowerCase());

  const hasGlobalDatasourceReadPermission = useHasPermission('read', GlobalProject, 'GlobalDatasource');
  const hasGlobalRoleReadPermission = useHasPermission('read', GlobalProject, 'GlobalRole');
  const hasGlobalRoleBindingReadPermission = useHasPermission('read', GlobalProject, 'GlobalRoleBinding');
  const hasGlobalSecretReadPermission = useHasPermission('read', GlobalProject, 'GlobalSecret');
  const hasGlobalVariableReadPermission = useHasPermission('read', GlobalProject, 'GlobalVariable');
  const hasUserReadPermission = useHasPermission('read', GlobalProject, 'User');

  const handleChange = (event: SyntheticEvent, newTabIndex: string): void => {
    setValue(newTabIndex);
    navigate(`/admin/${newTabIndex}`);
  };
  const marginTop = isMobileSize ? 1 : 2;
  console.log(isGlobalDatasourceEnabled);
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
          aria-label="Admin tabs"
        >
          {isGlobalVariableEnabled && (
            <MenuTab
              label="Global Variables"
              icon={<CodeJsonIcon />}
              iconPosition="start"
              {...a11yProps(variablesTabIndex)}
              value={variablesTabIndex}
              disabled={!hasGlobalVariableReadPermission}
            />
          )}
          {isGlobalDatasourceEnabled && (
            <MenuTab
              label="Global Datasources"
              icon={<DatabaseIcon />}
              iconPosition="start"
              {...a11yProps(datasourcesTabIndex)}
              value={datasourcesTabIndex}
              disabled={!hasGlobalDatasourceReadPermission}
            />
          )}
          <MenuTab
            label="Global Secrets"
            icon={<KeyIcon />}
            iconPosition="start"
            {...a11yProps(secretsTabIndex)}
            value={secretsTabIndex}
            disabled={!hasGlobalSecretReadPermission}
          />
          {isAuthEnabled && (
            <MenuTab
              label="Global Roles"
              icon={<ShieldIcon />}
              iconPosition="start"
              {...a11yProps(roleBindingsTabIndex)}
              value={rolesTabIndex}
              disabled={!hasGlobalRoleReadPermission}
            />
          )}
          {isAuthEnabled && (
            <MenuTab
              label="Global Role Bindings"
              icon={<ShieldAccountIcon />}
              iconPosition="start"
              {...a11yProps(roleBindingsTabIndex)}
              value={roleBindingsTabIndex}
              disabled={!hasGlobalRoleBindingReadPermission}
            />
          )}
          {isAuthEnabled && (
            <MenuTab
              label="Users"
              icon={<AccountIcon />}
              iconPosition="start"
              {...a11yProps(usersTabIndex)}
              value={usersTabIndex}
              disabled={!hasUserReadPermission}
            />
          )}
        </MenuTabs>
        {!isMobileSize && <TabButton index={value} />}
      </Stack>
      {isMobileSize && <TabButton index={value} fullWidth sx={{ marginTop: 0.5 }} />}
      {isGlobalVariableEnabled && (
        <TabPanel value={value} index={variablesTabIndex} sx={{ marginTop: marginTop }}>
          <GlobalVariables id="global-variable-list" />
        </TabPanel>
      )}
      {isGlobalDatasourceEnabled && (
        <TabPanel value={value} index={datasourcesTabIndex} sx={{ marginTop: marginTop }}>
          <GlobalDatasources id="global-datasource-list" />
        </TabPanel>
      )}
      <TabPanel value={value} index={secretsTabIndex} sx={{ marginTop: marginTop }}>
        <GlobalSecrets id="global-secret-list" />
      </TabPanel>
      {isAuthEnabled && (
        <>
          <TabPanel value={value} index={rolesTabIndex} sx={{ marginTop: marginTop }}>
            <GlobalRoles id="global-role-list" />
          </TabPanel>
          <TabPanel value={value} index={roleBindingsTabIndex} sx={{ marginTop: marginTop }}>
            <GlobalRoleBindings id="global-rolebinding-list" />
          </TabPanel>
          <TabPanel value={value} index={usersTabIndex} sx={{ marginTop: isMobileSize ? 1 : 2 }}>
            <Users id="user-list" />
          </TabPanel>
        </>
      )}
    </Box>
  );
}
