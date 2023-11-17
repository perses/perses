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

import { DashboardResource, DEFAULT_DASHBOARD_DURATION, DEFAULT_REFRESH_INTERVAL } from '@perses-dev/core';
import Compass from 'mdi-material-ui/Compass';
import { generateMetadataName } from '../../../utils/metadata';
import AppBreadcrumbs from '../../../components/breadcrumbs/AppBreadcrumbs';
import ProjectExploreView from './ProjectExploreView';

const DEFAULT_DASHBOARD_NAME = 'Explore Page';

function ExploreView() {
  const dashboardResource: DashboardResource = {
    kind: 'Dashboard',
    metadata: {
      name: generateMetadataName(DEFAULT_DASHBOARD_NAME),
      project: '',
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
    <ProjectExploreView
      dashboardResource={dashboardResource}
      exploreTitleComponent={<AppBreadcrumbs rootPageName="Explore" icon={<Compass fontSize={'large'} />} />}
    />
  );
}

export default ExploreView;
