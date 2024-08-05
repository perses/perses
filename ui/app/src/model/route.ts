// Copyright 2024 The Perses Authors
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

export const AdminRoute = '/admin';
export const SignInRoute = '/sign-in';
export const SignUpRoute = '/sign-up';
export const ConfigRoute = '/config';
export const ImportRoute = '/import';
export const ProjectRoute = '/projects';
export const ExploreRoute = '/explore';

const paths = [AdminRoute, SignInRoute, SignUpRoute, ConfigRoute, ImportRoute, ProjectRoute, ExploreRoute];

export function getBasePathName(): string {
  return extractBasePathName(window.location.pathname);
}

// This dynamically/generically determines the pathPrefix
// by stripping the first known endpoint suffix from the window location path.
// It works out of the box for both direct
// hosting and reverse proxy deployments with no additional configurations required.
export function extractBasePathName(path: string): string {
  let basePath = path;
  if (basePath.endsWith('/')) {
    basePath = basePath.slice(0, -1);
  }
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    if (path && basePath.endsWith(path)) {
      basePath = basePath.slice(0, basePath.length - path.length);
      break;
    }
  }
  // In case we are in a dashboard page, then the route ends with /dashboards/<dashboard_name>.
  // In that particular case, we can remove everything after /projects
  const split = basePath.split(ProjectRoute)[0];
  if (split !== undefined) {
    return split;
  }
  return basePath;
}
