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

import { useParams } from 'react-router-dom';
import { DashboardResource, DEFAULT_DASHBOARD_DURATION, DEFAULT_REFRESH_INTERVAL } from '@perses-dev/core';
import { generateMetadataName } from '../../utils/metadata';
import ProjectBreadcrumbs from '../../components/ProjectBreadcrumbs';
import HelperExploreView from './HelperExploreView';

const DEFAULT_DASHBOARD_NAME = 'Explore Page';

/**
 * TBD
 */
function ExploreView() {
  const { projectName } = useParams();

  if (!projectName) {
    throw new Error('Unable to get project name');
  }

  const dashboardResource: DashboardResource = {
    kind: 'Dashboard',
    metadata: {
      name: generateMetadataName(DEFAULT_DASHBOARD_NAME),
      project: projectName,
      version: 0,
    },
    spec: {
      display: {
        name: DEFAULT_DASHBOARD_NAME,
      },
      duration: DEFAULT_DASHBOARD_DURATION,
      refreshInterval: DEFAULT_REFRESH_INTERVAL,
      variables: [],
      layouts: [],
      panels: {},
    },
  };

  return (
    <HelperExploreView
      dashboardResource={dashboardResource}
      exploreTitleComponent={<ProjectBreadcrumbs isExplore={true} projectName={dashboardResource.metadata.project} />}
    />
  );
}

export default ExploreView;
