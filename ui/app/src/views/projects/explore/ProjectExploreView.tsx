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

import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { PluginRegistry, ProjectStoreProvider, useProjectStore } from '@perses-dev/plugin-system';
import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { ExternalVariableDefinition } from '@perses-dev/dashboards';
import { ViewExplore } from '@perses-dev/explore';
import { CircularProgress, Stack } from '@mui/material';
import { CachedDatasourceAPI, HTTPDatasourceAPI } from '../../../model/datasource-api';
import { useGlobalVariableList } from '../../../model/global-variable-client';
import { useVariableList } from '../../../model/variable-client';
import { buildGlobalVariableDefinition, buildProjectVariableDefinition } from '../../../utils/variables';
import { bundledPluginLoader } from '../../../model/bundled-plugins';

export interface ProjectExploreViewProps {
  exploreTitleComponent?: React.ReactNode;
}

function ProjectExploreView(props: ProjectExploreViewProps): ReactElement {
  return (
    <ProjectStoreProvider enabledURLParams={true}>
      <HelperExploreView {...props} />
    </ProjectStoreProvider>
  );
}

function HelperExploreView(props: ProjectExploreViewProps): ReactElement {
  const { exploreTitleComponent } = props;
  const { project } = useProjectStore();
  const projectName = project?.metadata.name === 'none' ? '' : project?.metadata.name;

  const [datasourceApi] = useState(() => new CachedDatasourceAPI(new HTTPDatasourceAPI()));

  useEffect(() => {
    // warm up the caching of the datasources
    if (projectName) {
      datasourceApi.listDatasources(projectName);
    }
    datasourceApi.listGlobalDatasources();
  }, [datasourceApi, projectName]);

  // Collect the Project variables and setup external variables from it
  const { data: globalVars, isLoading: isLoadingGlobalVars } = useGlobalVariableList();
  const { data: projectVars, isLoading: isLoadingProjectVars } = useVariableList(projectName);
  const externalVariableDefinitions: ExternalVariableDefinition[] | undefined = useMemo(
    () => [
      buildProjectVariableDefinition(projectName || '', projectVars ?? []),
      buildGlobalVariableDefinition(globalVars ?? []),
    ],
    [projectName, projectVars, globalVars]
  );

  if (isLoadingProjectVars || isLoadingGlobalVars) {
    return (
      <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorAlert}>
      <PluginRegistry pluginLoader={bundledPluginLoader}>
        <ErrorBoundary FallbackComponent={ErrorAlert}>
          <ViewExplore
            datasourceApi={datasourceApi}
            externalVariableDefinitions={externalVariableDefinitions}
            exploreTitleComponent={exploreTitleComponent}
          />
        </ErrorBoundary>
      </PluginRegistry>
    </ErrorBoundary>
  );
}

export default ProjectExploreView;
