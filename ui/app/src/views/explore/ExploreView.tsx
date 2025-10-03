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

import Compass from 'mdi-material-ui/Compass';
import React, { ReactElement, useMemo } from 'react';
import { PluginRegistry } from '@perses-dev/plugin-system';
import { ExternalVariableDefinition } from '@perses-dev/dashboards';
import { CircularProgress, Stack } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { ViewExplore } from '@perses-dev/explore';
import AppBreadcrumbs from '../../components/breadcrumbs/AppBreadcrumbs';
import { useDatasourceApi } from '../../model/datasource-api';
import { useRemotePluginLoader } from '../../model/remote-plugin-loader';
import { useGlobalVariableList } from '../../model/global-variable-client';
import { buildGlobalVariableDefinition } from '../../utils/variables';

function ExploreView(): ReactElement {
  return (
    <HelperExploreView
      exploreTitleComponent={<AppBreadcrumbs rootPageName="Explore" icon={<Compass fontSize="large" />} />}
    />
  );
}

export interface HelperExploreViewProps {
  exploreTitleComponent?: React.ReactNode;
}

function HelperExploreView(props: HelperExploreViewProps): ReactElement {
  const { exploreTitleComponent } = props;

  const datasourceApi = useDatasourceApi();
  const pluginLoader = useRemotePluginLoader();

  // Collect the Project variables and setup external variables from it
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
            externalVariableDefinitions={externalVariableDefinitions}
            exploreTitleComponent={exploreTitleComponent}
          />
        </ErrorBoundary>
      </PluginRegistry>
    </ErrorBoundary>
  );
}

export default ExploreView;
