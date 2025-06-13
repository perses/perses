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
export const ProfileRoute = '/profile';

const paths = [
  AdminRoute,
  SignInRoute,
  SignUpRoute,
  ConfigRoute,
  ImportRoute,
  ProjectRoute,
  ExploreRoute,
  ProfileRoute,
];
const prefixPaths = [AdminRoute, ProjectRoute];

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
  for (const path of paths) {
    if (path && basePath.endsWith(path)) {
      basePath = basePath.slice(0, basePath.length - path.length);
      break;
    }
  }
  return removeAnyRoutePrefix(basePath);
}

function removeAnyRoutePrefix(basePath: string): string {
  for (const prefixPath of prefixPaths) {
    const split = basePath.split(prefixPath)[0];
    if (split !== undefined && split !== basePath) {
      return split;
    }
  }
  return basePath;
}
