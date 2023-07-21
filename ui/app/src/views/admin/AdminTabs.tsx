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
import CodeJsonIcon from 'mdi-material-ui/CodeJson';
import DatabaseIcon from 'mdi-material-ui/Database';
import { getDatasourceDisplayName, GlobalDatasource } from '@perses-dev/core';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '@perses-dev/components';
import { CRUDButton } from '../../components/CRUDButton/CRUDButton';
import { useCreateGlobalDatasourceMutation } from '../../model/admin-client';
import { GlobalDatasourceDrawer } from '../../components/DatasourceList/DatasourceDrawer';
import { GlobalDatasources } from './tabs/GlobalDatasources';

const variablesTabIndex = 'globalvariables';
const datasourcesTabIndex = 'globaldatasources';

interface TabButtonProps {
  index: string;
}

function TabButton(props: TabButtonProps) {
  const createDatasourceMutation = useCreateGlobalDatasourceMutation();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();

  const [isCreateGlobalDatasourceDrawerStateOpened, setCreateGlobalDatasourceFormStateOpened] = useState(false);

  const handleGlobalDatasourceCreation = useCallback(
    (datasource: GlobalDatasource) => {
      createDatasourceMutation.mutate(datasource, {
        onSuccess: (createdDatasource: GlobalDatasource) => {
          successSnackbar(`Datasource ${getDatasourceDisplayName(createdDatasource)} has been successfully created`);
          setCreateGlobalDatasourceFormStateOpened(false);
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
    case variablesTabIndex:
      return (
        <>
          <CRUDButton
            text="Add Global Variable"
            variant="contained"
            onClick={() => console.log('TODO implement Global Variable CRUD')}
          />
        </>
      );
    case datasourcesTabIndex:
      return (
        <>
          <CRUDButton
            text="Add Global Datasource"
            variant="contained"
            onClick={() => setCreateGlobalDatasourceFormStateOpened(true)}
          />
          <GlobalDatasourceDrawer
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
            isOpen={isCreateGlobalDatasourceDrawerStateOpened}
            saveActionStr="Create"
            onSave={handleGlobalDatasourceCreation}
            onClose={() => setCreateGlobalDatasourceFormStateOpened(false)}
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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ paddingTop: 2 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: string) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

interface DashboardVariableTabsProps {
  initialTab?: string;
}

export function AdminTabs(props: DashboardVariableTabsProps) {
  const { initialTab } = props;

  const navigate = useNavigate();

  const [value, setValue] = useState((initialTab ?? datasourcesTabIndex).toLowerCase());

  const handleChange = (event: SyntheticEvent, newTabIndex: string) => {
    setValue(newTabIndex);
    navigate(`/admin/${newTabIndex}`);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ marginLeft: 2.5, marginRight: 2.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tabs value={value} onChange={handleChange} aria-label="admin tabs">
          <Tab
            label="Global variables"
            icon={<CodeJsonIcon />}
            iconPosition="start"
            {...a11yProps(variablesTabIndex)}
            value={variablesTabIndex}
          />
          <Tab
            label="Global datasources"
            icon={<DatabaseIcon />}
            iconPosition="start"
            {...a11yProps(datasourcesTabIndex)}
            value={datasourcesTabIndex}
          />
        </Tabs>
        <TabButton index={value} />
      </Stack>
      <TabPanel value={value} index={variablesTabIndex}></TabPanel>
      <TabPanel value={value} index={datasourcesTabIndex}>
        <GlobalDatasources id="global-datasource-list" />
      </TabPanel>
    </Box>
  );
}
