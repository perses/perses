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
import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { PluginRegistry } from '@perses-dev/plugin-system';
import { ExternalVariableDefinition, getResourceDisplayName, ProjectResource } from '@perses-dev/core';
import { Autocomplete, CircularProgress, Stack, TextField } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { ViewExplore } from '@perses-dev/explore';
import { useQueryClient } from '@tanstack/react-query';
import AppBreadcrumbs from '../../components/breadcrumbs/AppBreadcrumbs';
import { useDatasourceApi } from '../../model/datasource-api';
import { useRemotePluginLoader } from '../../model/remote-plugin-loader';
import { useGlobalVariableList } from '../../model/global-variable-client';
import { useProjectList } from '../../model/project-client';
import { buildGlobalVariableDefinition } from '../../utils/variables';
import { useIsProjectDatasourceEnabled } from '../../context/Config';

function ExploreView(): ReactElement {
  return <HelperExploreView exploreTitleComponent={<AppBreadcrumbs rootPageName="Explore" icon={<Compass />} />} />;
}

export interface HelperExploreViewProps {
  exploreTitleComponent?: React.ReactNode;
}

function HelperExploreView(props: HelperExploreViewProps): ReactElement {
  const { exploreTitleComponent } = props;

  const [selectedProject, setSelectedProject] = useState<ProjectResource | null>(null);
  const projectName = selectedProject?.metadata.name;

  const datasourceApi = useDatasourceApi();
  const pluginLoader = useRemotePluginLoader();
  const isProjectDatasourceEnabled = useIsProjectDatasourceEnabled();
  const queryClient = useQueryClient();

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
            exploreTitleComponent={
              <Stack direction="row" alignItems="center" gap={2}>
                {exploreTitleComponent}
                {isProjectDatasourceEnabled && (
                  <Autocomplete<ProjectResource>
                    size="small"
                    options={projects ?? []}
                    getOptionLabel={(option) => getResourceDisplayName(option)}
                    value={selectedProject}
                    onChange={(_, value) => setSelectedProject(value)}
                    renderInput={(params) => <TextField {...params} label="Project" placeholder="Global" />}
                    sx={{ minWidth: 200 }}
                  />
                )}
              </Stack>
            }
          />
        </ErrorBoundary>
      </PluginRegistry>
    </ErrorBoundary>
  );
}

export default ExploreView;
