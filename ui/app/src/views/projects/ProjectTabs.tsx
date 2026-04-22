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

import { Box, BoxProps, Link, Stack } from '@mui/material';
import { ReactElement, SyntheticEvent, useCallback, useMemo, useState } from 'react';
import ViewDashboardIcon from 'mdi-material-ui/ViewDashboard';
import CodeJsonIcon from 'mdi-material-ui/CodeJson';
import DatabaseIcon from 'mdi-material-ui/Database';
import FolderIcon from 'mdi-material-ui/Folder';
import KeyIcon from 'mdi-material-ui/Key';
import {
  getResourceDisplayName,
  getResourceExtendedDisplayName,
  DashboardSelector,
  DatasourceResource,
  VariableResource,
  SecretResource,
  FolderResource,
} from '@perses-dev/core';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from '@perses-dev/components';
import { CRUDButton, CRUDButtonProps } from '../../components/CRUDButton/CRUDButton';
import { CreateDashboardDialog, CreateFolderDialog } from '../../components/dialogs';
import { VariableDrawer } from '../../components/variable/VariableDrawer';
import { DatasourceDrawer } from '../../components/datasource/DatasourceDrawer';
import { useCreateDatasourceMutation } from '../../model/datasource-client';
import { useCreateVariableMutation } from '../../model/variable-client';
import { useIsProjectDatasourceEnabled, useIsProjectVariableEnabled, useIsReadonly } from '../../context/Config';
import { MenuTab, MenuTabs } from '../../components/tabs';
import { useIsMobileSize } from '../../utils/browser-size';
import { SecretDrawer } from '../../components/secrets/SecretDrawer';
import { useCreateSecretMutation } from '../../model/secret-client';
import { useHasPermission } from '../../context/Authorization';
import { ProjectDashboards } from './tabs/ProjectDashboards';
import { ProjectVariables } from './tabs/ProjectVariables';
import { ProjectDatasources } from './tabs/ProjectDatasources';
import { ProjectSecrets } from './tabs/ProjectSecrets';

import { useCreateFolderMutation, useFolderList } from '../../model/folder-client';
import { ProjectFolders } from './tabs/ProjectFolders';

const foldersTabIndex = 'folders';
const dashboardsTabIndex = 'dashboards';
const datasourcesTabIndex = 'datasources';
const secretsTabIndex = 'secrets';
const variablesTabIndex = 'variables';

interface TabButtonProps extends CRUDButtonProps {
  index: string;
  projectName: string;
}

function TabButton({ index, projectName, ...props }: TabButtonProps): ReactElement {
  const navigate = useNavigate();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();

  const createDatasourceMutation = useCreateDatasourceMutation(projectName);
  const createSecretMutation = useCreateSecretMutation(projectName);
  const createVariableMutation = useCreateVariableMutation(projectName);

  const [isCreateDashboardDialogOpened, setCreateDashboardDialogOpened] = useState(false);
  const [isCreateFolderDialogOpened, setCreateFolderDialogOpened] = useState(false);
  const [isDatasourceDrawerOpened, setDatasourceDrawerOpened] = useState(false);
  const [isSecretDrawerOpened, setSecretDrawerOpened] = useState(false);
  const [isVariableDrawerOpened, setVariableDrawerOpened] = useState(false);

  const isReadonly = useIsReadonly();
  const { data: folders = [], isLoading } = useFolderList({ project: projectName });

  const handleDashboardCreation = (dashboardSelector: DashboardSelector): void => {
    navigate(`/projects/${dashboardSelector.project}/folders/${dashboardSelector.folder}/dashboard/new`, {
      state: { name: dashboardSelector.dashboard },
    });
  };

  const { mutate: createFolder } = useCreateFolderMutation((data) => {
    setCreateFolderDialogOpened(false);
  });

  const handleFolderCreation = (folderInfo: { project: string; folder: string }) => {
    const folder: FolderResource = {
      kind: 'Folder',
      metadata: {
        project: folderInfo.project,
        name: folderInfo.folder,
      },
    };

    createFolder(folder);
  };

  const handleDatasourceCreation = useCallback(
    (datasource: DatasourceResource) => {
      createDatasourceMutation.mutate(datasource, {
        onSuccess: (createdDatasource: DatasourceResource) => {
          successSnackbar(`Datasource ${getResourceDisplayName(createdDatasource)} has been successfully created`);
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
          successSnackbar(`Variable ${getResourceExtendedDisplayName(updatedVariable)} has been successfully created`);
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
    case foldersTabIndex:
      return (
        <>
          <CRUDButton
            action="create"
            scope="Folder"
            project={projectName}
            variant="contained"
            onClick={() => setCreateFolderDialogOpened(true)}
            {...props}
          >
            Add Folder
          </CRUDButton>
          <CreateFolderDialog
            open={isCreateFolderDialogOpened}
            projects={[{ kind: 'Project', metadata: { name: projectName }, spec: {} }]}
            hideProjectSelect={true}
            onClose={() => setCreateFolderDialogOpened(false)}
            onSuccess={handleFolderCreation}
          />
        </>
      );
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
            projects={[{ kind: 'Project', metadata: { name: projectName }, spec: {} }]}
            folders={folders}
            hideProjectSelect={true}
            onClose={() => setCreateDashboardDialogOpened(false)}
            onSuccess={handleDashboardCreation}
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
              spec: {},
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

function TabPanel({ children, value, index, ...props }: TabPanelProps): ReactElement {
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

function a11yProps(index: string): Record<string, unknown> {
  return {
    id: `project-tab-${index}`,
    'aria-controls': `project-tabpanel-${index}`,
  };
}

interface DashboardVariableTabsProps {
  projectName: string;
  initialTab?: string;
}

export function ProjectTabs(props: DashboardVariableTabsProps): ReactElement {
  const { projectName, initialTab } = props;
  const { tab } = useParams();
  const isProjectDatasourceEnabled = useIsProjectDatasourceEnabled();
  const isProjectVariableEnabled = useIsProjectVariableEnabled();

  const navigate = useNavigate();
  const isMobileSize = useIsMobileSize();

  const [value, setValue] = useState((initialTab ?? foldersTabIndex).toLowerCase());

  const hasDashboardReadPermission = useHasPermission('read', projectName, 'Dashboard');
  const hasDatasourceReadPermission = useHasPermission('read', projectName, 'Datasource');
  const hasSecretReadPermission = useHasPermission('read', projectName, 'Secret');
  const hasVariableReadPermission = useHasPermission('read', projectName, 'Variable');

  const handleChange = (event: SyntheticEvent, newTabIndex: string): void => {
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
            label="Folders"
            icon={<FolderIcon />}
            iconPosition="start"
            {...a11yProps(foldersTabIndex)}
            value={foldersTabIndex}
            disabled={!hasDashboardReadPermission}
          />
          <MenuTab
            label="Dashboards"
            icon={<ViewDashboardIcon />}
            iconPosition="start"
            {...a11yProps(dashboardsTabIndex)}
            value={dashboardsTabIndex}
            disabled={!hasDashboardReadPermission}
          />
          {isProjectVariableEnabled && (
            <MenuTab
              label="Variables"
              icon={<CodeJsonIcon />}
              iconPosition="start"
              {...a11yProps(variablesTabIndex)}
              value={variablesTabIndex}
              disabled={!hasVariableReadPermission}
            />
          )}
          {isProjectDatasourceEnabled && (
            <MenuTab
              label="Datasources"
              icon={<DatabaseIcon />}
              iconPosition="start"
              {...a11yProps(datasourcesTabIndex)}
              value={datasourcesTabIndex}
              disabled={!hasDatasourceReadPermission}
            />
          )}
          <MenuTab
            label="Secrets"
            icon={<KeyIcon />}
            iconPosition="start"
            {...a11yProps(secretsTabIndex)}
            value={secretsTabIndex}
            disabled={!hasSecretReadPermission}
          />
        </MenuTabs>
        {!isMobileSize && <TabButton index={value} projectName={projectName} />}
      </Stack>
      <TabPanel value={value} index={foldersTabIndex} sx={{ marginTop: isMobileSize ? 1 : 2 }}>
        <ProjectFolders projectName={projectName} id="project-folder-list" />
      </TabPanel>

      {isMobileSize && <TabButton index={value} projectName={projectName} fullWidth sx={{ marginTop: 0.5 }} />}
      <TabPanel value={value} index={dashboardsTabIndex} sx={{ marginTop: isMobileSize ? 1 : 2 }}>
        <ProjectDashboards projectName={projectName} id="main-dashboard-list" />
      </TabPanel>
      {isProjectVariableEnabled && (
        <TabPanel value={value} index={variablesTabIndex} sx={{ marginTop: isMobileSize ? 1 : 2 }}>
          <ProjectVariables projectName={projectName} id="project-variable-list" />
        </TabPanel>
      )}
      {isProjectDatasourceEnabled && (
        <TabPanel value={value} index={datasourcesTabIndex} sx={{ marginTop: isMobileSize ? 1 : 2 }}>
          <ProjectDatasources projectName={projectName} id="project-datasource-list" />
        </TabPanel>
      )}
      <TabPanel value={value} index={secretsTabIndex} sx={{ marginTop: isMobileSize ? 1 : 2 }}>
        <ProjectSecrets projectName={projectName} id="project-secret-list" />
      </TabPanel>
    </Box>
  );
}
