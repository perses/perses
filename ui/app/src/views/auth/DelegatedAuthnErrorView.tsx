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

import { Divider, LinearProgress, Stack } from '@mui/material';
import * as React from 'react';
import { ReactElement, useEffect } from 'react';
import { ErrorAlert, useSnackbar } from '@perses-dev/components';
import { useNavigate } from 'react-router-dom';
import { useRedirectQueryParam } from '../../model/auth/auth-client';
import { useDarkMode } from '../../context/DarkMode';
import { useIsLaptopSize } from '../../utils/browser-size';
import { useCurrentUser } from '../../model/user-client';
import { PersesLogo } from './SignWrapper';

function DelegatedAuthnErrorView(): ReactElement {
  const authnCheck = useCurrentUser();
  const navigate = useNavigate();
  const { isDarkModeEnabled } = useDarkMode();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const redirectPath = useRedirectQueryParam();

  const isLaptopSize = useIsLaptopSize();

  useEffect(() => {
    if (authnCheck?.data?.metadata?.name) {
      successSnackbar(`Successfully login`);
      navigate(redirectPath);
    }
  }, [authnCheck?.data?.metadata?.name, successSnackbar, navigate, exceptionSnackbar, redirectPath]);

  return (
    <Stack
      width="100%"
      flexDirection={isLaptopSize ? 'row' : 'column'}
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      <PersesLogo isLaptopSize={isLaptopSize} isDarkModeEnabled={isDarkModeEnabled} />
      <Divider
        orientation={isLaptopSize ? 'vertical' : 'horizontal'}
        variant="middle"
        flexItem
        sx={{ marginTop: isLaptopSize ? '30vh' : undefined, marginBottom: isLaptopSize ? '30vh' : undefined }}
      />
      <Stack gap={1} sx={{ maxWidth: '85%', minWidth: '200px' }}>
        {authnCheck.status === 'loading' && <LinearProgress />}
        {authnCheck.status === 'error' && <ErrorAlert error={authnCheck.error} />}
      </Stack>
    </Stack>
  );
}

export default DelegatedAuthnErrorView;
