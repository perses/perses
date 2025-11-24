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

import { DashboardResource, EphemeralDashboardResource } from '@perses-dev/core';
import { stringify } from 'yaml';

type SerializedDashboard = {
  contentType: string;
  content: string;
};

function serializeYaml(dashboard: DashboardResource | EphemeralDashboardResource, shape?: 'cr'): SerializedDashboard {
  let content: string;

  if (shape === 'cr') {
    const name = dashboard.metadata.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    content = stringify(
      {
        apiVersion: 'perses.dev/v1alpha1',
        kind: 'PersesDashboard',
        metadata: {
          labels: {
            'app.kubernetes.io/name': 'perses-dashboard',
            'app.kubernetes.io/instance': name,
            'app.kubernetes.io/part-of': 'perses-operator',
          },
          name,
          namespace: dashboard.metadata.project,
        },
        spec: dashboard.spec,
      },
      { schema: 'yaml-1.1' }
    );
  } else {
    content = stringify(dashboard, { schema: 'yaml-1.1' });
  }

  return { contentType: 'application/yaml', content };
}

export function serializeDashboard(
  dashboard: DashboardResource | EphemeralDashboardResource,
  format: 'json' | 'yaml',
  shape?: 'cr'
): SerializedDashboard {
  switch (format) {
    case 'json':
      return { contentType: 'application/json', content: JSON.stringify(dashboard, null, 2) };
    case 'yaml':
      return serializeYaml(dashboard, shape);
  }
}
