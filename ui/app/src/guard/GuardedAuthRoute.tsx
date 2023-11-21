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

import { Await, Outlet, useNavigate } from 'react-router-dom';
import { useSnackbar } from '@perses-dev/components';
import { Suspense, useEffect, useState } from 'react';
import { LinearProgress } from '@mui/material';
import { useGetConfigMutation } from '../model/config-client';
import { useIsTokenExist } from '../model/auth-client';
import { SignInRoute } from '../model/route';

function GuardedAuthRoute() {
  const { mutateAsync } = useGetConfigMutation();
  const { exceptionSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const isTokenExist = useIsTokenExist();
  const [authPromise, setAuthPromise] = useState<Promise<boolean>>();

  useEffect(() => {
    if (authPromise !== undefined) {
      return;
    }
    setAuthPromise(
      mutateAsync()
        .catch((err) => {
          exceptionSnackbar(err);
          throw err;
        })
        .then((conf) => {
          if (!conf.security.authorization.enable_authorization) {
            return true;
          }
          // In case the token is null, it means we weren't able to find the cookie.
          if (!isTokenExist) {
            navigate(SignInRoute);
            const err = new Error('session has expired');
            exceptionSnackbar(err);
            throw err;
          }
          return true;
        })
    );
  }, [authPromise, exceptionSnackbar, isTokenExist, mutateAsync, navigate]);
  return (
    <Suspense fallback={<LinearProgress />}>
      <Await resolve={authPromise}>
        <Outlet />
      </Await>
    </Suspense>
  );
}

export default GuardedAuthRoute;
