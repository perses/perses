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

import { Divider, LinearProgress, Stack } from '@mui/material';
import { ReactElement, useEffect } from 'react';
import { ErrorAlert, useSnackbar } from '@perses-dev/components';
import { useNavigate } from 'react-router-dom';
import { useRedirectQueryParam } from '../../model/auth/auth-client';
import PersesLogoCropped from '../../components/logo/PersesLogoCropped';
import DarkThemePersesLogo from '../../components/logo/DarkThemePersesLogo';
import LightThemePersesLogo from '../../components/logo/LightThemePersesLogo';
import { useDarkMode } from '../../context/DarkMode';
import { useIsLaptopSize } from '../../utils/browser-size';
import { useExternalAuthn } from '../../model/auth/external-auth-client';

function ExternalSignInView(): ReactElement {
  const authCheck = useExternalAuthn();
  // default to kubernetes as the default external auth provider
  const navigate = useNavigate();
  const { isDarkModeEnabled } = useDarkMode();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const redirectPath = useRedirectQueryParam();

  const isLaptopSize = useIsLaptopSize();

  useEffect(() => {
    if (authCheck?.data?.metadata?.name) {
      successSnackbar(`Successfully login`);
      navigate(redirectPath);
    }
  }, [authCheck?.data?.metadata?.name, successSnackbar, navigate, exceptionSnackbar, redirectPath]);

  return (
    <Stack
      width="100%"
      flexDirection={isLaptopSize ? 'row' : 'column'}
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      {!isLaptopSize ? <PersesLogoCropped /> : isDarkModeEnabled ? <DarkThemePersesLogo /> : <LightThemePersesLogo />}
      <Divider
        orientation={isLaptopSize ? 'vertical' : 'horizontal'}
        variant="middle"
        flexItem
        sx={{ marginTop: isLaptopSize ? '30vh' : undefined, marginBottom: isLaptopSize ? '30vh' : undefined }}
      />
      <Stack gap={1} sx={{ maxWidth: '85%', minWidth: '200px' }}>
        {authCheck.status === 'loading' && <LinearProgress />}
        {authCheck.status === 'error' && <ErrorAlert error={authCheck.error} />}
      </Stack>
    </Stack>
  );
}

export default ExternalSignInView;
