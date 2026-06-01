// Copyright The Perses Authors
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

import Compass from 'mdi-material-ui/Compass';
import Archive from 'mdi-material-ui/Archive';
import ChevronDown from 'mdi-material-ui/ChevronDown';
import React, { ReactElement, useEffect, useMemo, MouseEvent, useState } from 'react';
import { PluginRegistry } from '@perses-dev/plugin-system';
import { ExternalVariableDefinition, getResourceDisplayName, ProjectResource } from '@perses-dev/core';
import { CircularProgress, Menu, MenuItem, Stack, ListItemIcon, ListItemText } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { ViewExplore } from '@perses-dev/explore';
import { useQueryClient } from '@tanstack/react-query';
import { StringParam, useQueryParam } from 'use-query-params';
import { Breadcrumbs, HomeLinkCrumb, StackCrumb, TitleCrumb } from '../../components/breadcrumbs/breadcrumbs';
import { useDatasourceApi } from '../../model/datasource-api';
import { useRemotePluginLoader } from '../../model/remote-plugin-loader';
import { useGlobalVariableList } from '../../model/global-variable-client';
import { useProjectList } from '../../model/project-client';
import { buildGlobalVariableDefinition } from '../../utils/variables';
import { useIsProjectDatasourceEnabled } from '../../context/Config';
import { useIsMobileSize } from '../../utils/browser-size';

function ExploreView(): ReactElement {
  return <HelperExploreView />;
}

interface ProjectScopeCrumbProps {
  projectName: string | undefined;
  projects: ProjectResource[];
  onSelect: (projectName: string | undefined) => void;
}

function ProjectScopeCrumb(props: ProjectScopeCrumbProps): ReactElement {
  const { projectName, projects, onSelect } = props;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpen = (event: MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  const handleSelect = (name: string | undefined): void => {
    onSelect(name);
    handleClose();
  };

  const selectedProject = projects.find((p) => p.metadata.name === projectName);

  return (
    <>
      <StackCrumb>
        <Archive />
        <TitleCrumb inheritTypography={true}>
          <Stack
            direction="row"
            alignItems="center"
            gap={0.25}
            onClick={handleOpen}
            sx={(theme) => ({
              cursor: 'pointer',
              borderRadius: 1,
              px: 0.75,
              py: 0.25,
              backgroundColor: theme.palette.action.hover,
              border: '1px solid',
              borderColor: theme.palette.divider,
              transition: theme.transitions.create(['background-color', 'border-color'], {
                duration: theme.transitions.duration.shorter,
              }),
              '&:hover': {
                backgroundColor: theme.palette.action.selected,
                borderColor: theme.palette.action.disabled,
              },
            })}
          >
            {selectedProject ? getResourceDisplayName(selectedProject) : 'Global'}
            <ChevronDown sx={{ fontSize: 16 }} />
          </Stack>
        </TitleCrumb>
      </StackCrumb>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{ paper: { sx: { maxHeight: 300 } } }}
      >
        <MenuItem selected={!projectName} onClick={() => handleSelect(undefined)}>
          <ListItemText>Global only</ListItemText>
        </MenuItem>
        {projects.map((project) => (
          <MenuItem
            key={project.metadata.name}
            selected={project.metadata.name === projectName}
            onClick={() => handleSelect(project.metadata.name)}
          >
            <ListItemIcon>
              <Archive fontSize="small" />
            </ListItemIcon>
            <ListItemText>{getResourceDisplayName(project)}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

function HelperExploreView(): ReactElement {
  const [projectParam, setProjectParam] = useQueryParam('project', StringParam);
  const projectName = projectParam ?? undefined;

  const datasourceApi = useDatasourceApi();
  const pluginLoader = useRemotePluginLoader();
  const isProjectDatasourceEnabled = useIsProjectDatasourceEnabled();
  const queryClient = useQueryClient();
  const isMobileSize = useIsMobileSize();

  // Invalidate datasource select item cache when project changes so
  // DatasourceStoreProvider re-fetches with the new project scope
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['listDatasourceSelectItems'] });
  }, [projectName, queryClient]);

  // Fetch the list of projects the user has access to
  const { data: projects } = useProjectList({ enabled: isProjectDatasourceEnabled });

  // Collect global variables
  const { data: globalVars, isLoading: isLoadingGlobalVars } = useGlobalVariableList();
  const externalVariableDefinitions: ExternalVariableDefinition[] | undefined = useMemo(
    () => [buildGlobalVariableDefinition(globalVars ?? [])],
    [globalVars]
  );

  const exploreTitleComponent = useMemo(() => {
    const breadcrumbContent = isMobileSize ? (
      <Breadcrumbs>
        <StackCrumb>
          <Compass />
          <TitleCrumb>Explore</TitleCrumb>
        </StackCrumb>
      </Breadcrumbs>
    ) : (
      <Breadcrumbs>
        <HomeLinkCrumb />
        {isProjectDatasourceEnabled && (
          <ProjectScopeCrumb
            projectName={projectName}
            projects={projects ?? []}
            onSelect={(name) => setProjectParam(name ?? undefined)}
          />
        )}
        <StackCrumb>
          <Compass />
          <TitleCrumb>Explore</TitleCrumb>
        </StackCrumb>
      </Breadcrumbs>
    );
    return breadcrumbContent;
  }, [isMobileSize, isProjectDatasourceEnabled, projectName, projects, setProjectParam]);

  if (isLoadingGlobalVars) {
    return (
      <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorAlert}>
      <PluginRegistry pluginLoader={pluginLoader}>
        <ErrorBoundary FallbackComponent={ErrorAlert}>
          <ViewExplore
            datasourceApi={datasourceApi}
            projectName={projectName}
            externalVariableDefinitions={externalVariableDefinitions}
            exploreTitleComponent={exploreTitleComponent}
          />
        </ErrorBoundary>
      </PluginRegistry>
    </ErrorBoundary>
  );
}

export default ExploreView;
