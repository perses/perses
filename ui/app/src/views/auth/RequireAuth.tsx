// Copyright 2025 The Perses Authors
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

import { ReactElement } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthorizationProvider, useIsAuthEnabled } from '../../context/Config';
import { buildRedirectQueryString, useIsLoggedIn } from '../../model/auth/auth-client';
import { ExternalSignInRoute, SignInRoute } from '../../model/route';
import { useExternalUsername } from '../../model/auth/external-auth-client';

function RequireAuth(): ReactElement | null {
  const provider = useAuthorizationProvider();
  switch (provider) {
    case 'external':
      return <RequireExternalAuth />;
    case 'native':
    case 'none':
    default:
      return <RequireNativeAuth />;
  }
}

/**
 * This component aims to redirect the user to the SignIn page if not logged in.
 * Otherwise, it just loads the underlying component(s) defined as children.
 * This is leveraging the following mechanism:
 * https://reactrouter.com/en/main/upgrading/v5#refactor-custom-routes
 * https://gist.github.com/mjackson/d54b40a094277b7afdd6b81f51a0393f
 * @param children
 * @constructor
 */
function RequireNativeAuth(): ReactElement | null {
  const isAuthEnabled = useIsAuthEnabled();
  const isLoggedIn = useIsLoggedIn();
  const location = useLocation();
  if (!isAuthEnabled || isLoggedIn) {
    return <Outlet />;
  }
  let to = SignInRoute;
  if (location.pathname !== '' && location.pathname !== '/') {
    to += `?${buildRedirectQueryString(location.pathname + location.search)}`;
  }
  return <Navigate to={to} />;
}

function RequireAuthEnabled(): ReactElement {
  const isAuthEnabled = useIsAuthEnabled();
  if (!isAuthEnabled) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function RequireExternalAuth(): ReactElement | null {
  const externalUsername = useExternalUsername();
  const location = useLocation();

  if (externalUsername) {
    return <Outlet />;
  }

  let to = ExternalSignInRoute;
  if (location.pathname !== '' && location.pathname !== '/') {
    to += `?${buildRedirectQueryString(location.pathname + location.search)}`;
  }
  return <Navigate to={to} />;
}

export { RequireAuth, RequireAuthEnabled, RequireExternalAuth };
