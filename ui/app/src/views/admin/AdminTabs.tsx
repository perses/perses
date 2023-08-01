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
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '@perses-dev/components';
import { getVariableExtendedDisplayName, GlobalVariableResource } from '@perses-dev/core';
import { CRUDButton } from '../../components/CRUDButton/CRUDButton';
import { VariableFormDrawer } from '../../components/VariableList/VariableFormDrawer';
import { useCreateGlobalVariableMutation } from '../../model/global-variable-client';
import { GlobalVariables } from './tabs/GlobalVariables';

const variablesTabIndex = 'variables';
const datasourcesTabIndex = 'datasources';

interface TabButtonProps {
  index: string;
}

function TabButton(props: TabButtonProps) {
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const createGlobalVariableMutation = useCreateGlobalVariableMutation();

  const [openCreateVariableDrawerState, setOpenCreateVariableDrawerState] = useState(false);
  const handleVariableCreation = useCallback(
    (variable: GlobalVariableResource) => {
      createGlobalVariableMutation.mutate(variable, {
        onSuccess: (updatedVariable: GlobalVariableResource) => {
          successSnackbar(
            `Global Variable ${getVariableExtendedDisplayName(updatedVariable)} have been successfully created`
          );
          setOpenCreateVariableDrawerState(false);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, createGlobalVariableMutation]
  );

  switch (props.index) {
    case variablesTabIndex:
      return (
        <>
          <CRUDButton
            text="Add Global Variable"
            variant="contained"
            onClick={() => setOpenCreateVariableDrawerState(true)}
          />
          <VariableFormDrawer
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
            text="Add Global Datasource"
            variant="contained"
            onClick={() => console.log('TODO implement Global Datasource CRUD')}
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

interface AdminTabsProps {
  initialTab?: string;
}

export function AdminTabs(props: AdminTabsProps) {
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
      <TabPanel value={value} index={variablesTabIndex}>
        <GlobalVariables id="global-variable-list" />
      </TabPanel>
      <TabPanel value={value} index={datasourcesTabIndex}></TabPanel>
    </Box>
  );
}
