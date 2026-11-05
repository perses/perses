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

import * as PersesClient from '@perses-dev/client';
import * as PersesComponents from '@perses-dev/components';
import * as PersesDashboards from '@perses-dev/dashboards';
import * as PersesExplore from '@perses-dev/explore';
import * as PersesPluginSystem from '@perses-dev/plugin-system';
import { registerHostSharedModules } from '@perses-dev/plugin-system';
import * as PersesSpec from '@perses-dev/spec';
import React from 'react';
import ReactDOM from 'react-dom/client';

import Router from './Router';

// Provide the host's already-loaded perses packages to the plugin runtime as synchronous
// Module Federation singletons.
registerHostSharedModules({
  '@perses-dev/spec': PersesSpec,
  '@perses-dev/client': PersesClient,
  '@perses-dev/components': PersesComponents,
  '@perses-dev/plugin-system': PersesPluginSystem,
  '@perses-dev/explore': PersesExplore,
  '@perses-dev/dashboards': PersesDashboards,
});

/**
 * Renders the Perses application in the target container.
 */
export function renderApp(container: Element | null): void {
  if (container === null) {
    return;
  }

  const root = ReactDOM.createRoot(container);

  root.render(
    <React.StrictMode>
      <Router />
    </React.StrictMode>,
  );
}
