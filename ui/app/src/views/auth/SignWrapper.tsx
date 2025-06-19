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

/* TODO: @Gladorme check social button types */
/* eslint @typescript-eslint/explicit-function-return-type: 0 */
/* typescript-eslint/explicit-module-boundary-types: 0 */

import { Alert, AlertTitle, alpha, Divider, Stack, Theme, useTheme } from '@mui/material';
import { ReactElement, ReactNode, useEffect } from 'react';
import {
  AmazonLoginButton,
  AppleLoginButton,
  BufferLoginButton,
  createButton,
  createSvgIcon,
  DiscordLoginButton,
  FacebookLoginButton,
  GithubLoginButton,
  GoogleLoginButton,
  InstagramLoginButton,
  LinkedInLoginButton,
  MetamaskLoginButton,
  MicrosoftLoginButton,
  OktaLoginButton,
  SlackLoginButton,
  TelegramLoginButton,
  TikTokLoginButton,
  TwitterLoginButton,
  YahooLoginButton,
  ZaloLoginButton,
} from 'react-social-login-buttons';
import * as React from 'react';

import Gitlab from 'mdi-material-ui/Gitlab';
import Bitbucket from 'mdi-material-ui/Bitbucket';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../../context/DarkMode';
import PersesLogoCropped from '../../components/logo/PersesLogoCropped';
import DarkThemePersesLogo from '../../components/logo/DarkThemePersesLogo';
import LightThemePersesLogo from '../../components/logo/LightThemePersesLogo';
import { useIsLaptopSize } from '../../utils/browser-size';
import { useConfigContext, useIsK8sAuth } from '../../context/Config';
import { buildRedirectQueryString, useIsAccessTokenExist, useRedirectQueryParam } from '../../model/auth-client';

// A simple map to know which button to use, according to the configuration.
// If the issuer/auth url contains the given key, this will use the corresponding button.
// noinspection JSUnusedGlobalSymbols
const SOCIAL_BUTTONS_MAPPING = {
  // Managed by the lib.
  amazon: () => AmazonLoginButton,
  apple: () => AppleLoginButton,
  buffer: () => BufferLoginButton,
  discord: () => DiscordLoginButton,
  facebook: () => FacebookLoginButton,
  github: () => GithubLoginButton,
  google: () => GoogleLoginButton,
  instagram: () => InstagramLoginButton,
  linkedin: () => LinkedInLoginButton,
  metamask: () => MetamaskLoginButton,
  microsoft: () => MicrosoftLoginButton,
  okta: () => OktaLoginButton,
  slack: () => SlackLoginButton,
  telegram: () => TelegramLoginButton,
  tiktok: () => TikTokLoginButton,
  twitter: () => TwitterLoginButton,
  yahoo: () => YahooLoginButton,
  zalo: () => ZaloLoginButton,
  // Not (yet?) managed by the lib.
  gitlab: () =>
    createButton({
      icon: createSvgIcon(Gitlab),
      iconFormat: (name) => `fa fa-${name}`,
      style: { background: '#fc6d26' },
      activeStyle: { background: '#d55a1c' },
    }),
  bitbucket: () =>
    createButton({
      icon: createSvgIcon(Bitbucket),
      iconFormat: (name) => `fa fa-${name}`,
      style: { background: '#0C66E4' },
      activeStyle: { background: '#0055CC' },
    }),
  // Default button. Will match all remaining providers.
  '': (theme: Theme) => {
    return createButton({
      icon: '',
      style: {
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.background.default,
      },
      activeStyle: {
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.hoverOpacity),
      },
    });
  },
};

/**
 * Get the social button corresponding with the given URL (issuer or auth url).
 * If no social button is associated, it will build one using the theme.
 * @param theme
 * @param url
 */
function computeSocialButtonFromURL(theme: Theme, url: string) {
  for (const [key, createButton] of Object.entries(SOCIAL_BUTTONS_MAPPING)) {
    if (url.includes(key)) {
      return createButton(theme);
    }
  }

  // Should not happen as '' is always contained in any string.
  return SOCIAL_BUTTONS_MAPPING[''](theme);
}

export function SignWrapper(props: { children: ReactNode }): ReactElement {
  const { isDarkModeEnabled } = useDarkMode();
  const isLaptopSize = useIsLaptopSize();
  const config = useConfigContext();
  const theme = useTheme();
  const oauthProviders = (config.config?.security?.authentication?.providers?.oauth || []).map((provider) => ({
    path: `oauth/${provider.slug_id}`,
    name: provider.name,
    button: computeSocialButtonFromURL(theme, provider.auth_url),
  }));
  const oidcProviders = (config.config?.security?.authentication?.providers?.oidc || []).map((provider) => ({
    path: `oidc/${provider.slug_id}`,
    name: provider.name,
    button: computeSocialButtonFromURL(theme, provider.issuer),
  }));
  const socialProviders = [...oidcProviders, ...oauthProviders];
  const nativeProviderIsEnabled = config.config?.security?.authentication?.providers?.enable_native;
  const isK8sAuth = useIsK8sAuth();
  const path = useRedirectQueryParam();
  const isAuthenticated = useIsAccessTokenExist(true);
  const redirectPath = useRedirectQueryParam();
  const navigate = useNavigate();

  useEffect(() => {
    if (isK8sAuth && isAuthenticated) {
      navigate(redirectPath);
    }
  }, [isAuthenticated, isK8sAuth, redirectPath, navigate]);

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
        {nativeProviderIsEnabled && socialProviders.length > 0 && (
          <div>
            <Divider sx={{ marginTop: '16px' }}>or</Divider>
          </div>
        )}
        {socialProviders.map((provider) => {
          const SocialButton = provider.button;
          return (
            <SocialButton
              iconSize="20px"
              size="32px"
              key={provider.path}
              fullWidth={true}
              style={{ fontSize: '1em' }}
              onClick={() => {
                window.location.href = `/api/auth/providers/${provider.path}/login?${buildRedirectQueryString(path)}`;
              }}
            >
              Sign in with {provider.name}
            </SocialButton>
          );
        })}
        {isK8sAuth && (
          <Alert severity="error" variant="outlined">
            <AlertTitle>Missing Authorization Token</AlertTitle>Check Deployment Configuration
          </Alert>
        )}
      </Stack>
    </Stack>
  );
}
