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

import { Button, Divider, Stack } from '@mui/material';
import { ReactNode } from 'react';
import { useDarkMode } from '../../context/DarkMode';
import PersesLogoCropped from '../../components/logo/PersesLogoCropped';
import DarkThemePersesLogo from '../../components/logo/DarkThemePersesLogo';
import LightThemePersesLogo from '../../components/logo/LightThemePersesLogo';
import { useIsLaptopSize } from '../../utils/browser-size';
import { useConfigContext } from '../../context/Config';

export function SignWrapper(props: { children: ReactNode }) {
  const { isDarkModeEnabled } = useDarkMode();
  const isLaptopSize = useIsLaptopSize();
  const config = useConfigContext();
  const oauthProviders = (config.config?.security?.authentication?.providers?.oauth || []).map((provider) => ({
    path: `oauth/${provider.slug_id}`,
    name: provider.name,
  }));
  const oidcProviders = (config.config?.security?.authentication?.providers?.oidc || []).map((provider) => ({
    path: `oidc/${provider.slug_id}`,
    name: provider.name,
  }));
  const socialProviders = [...oidcProviders, ...oauthProviders];
  const nativeProviderIsEnabled = config.config?.security?.authentication?.providers?.enable_native;

  // If there is only one social provider, we automatically redirect to its login page
  // TODO(cegarcia): Discuss that with other mates as it gives some weird behavior with automatic re-login when we logout
  if (!nativeProviderIsEnabled && socialProviders.length == 1 && socialProviders[0]) {
    location.href = `/api/auth/providers/${socialProviders[0].path}/login`;
  }
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
        {nativeProviderIsEnabled && props.children}
        {socialProviders.length > 0 && (
          <div>
            <Divider sx={{ marginTop: '16px' }}>{nativeProviderIsEnabled && 'or'} sign in with</Divider>
          </div>
        )}
        {socialProviders.map((provider) => (
          <Button
            fullWidth={true}
            variant={'contained'}
            color={'secondary'}
            key={provider.path}
            href={`/api/auth/providers/${provider.path}/login`}
          >
            {provider.name}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
