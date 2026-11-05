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

import { ThemeProvider, createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { SignWrapper } from './SignWrapper';

const { mockUseQueryParam } = vi.hoisted(() => ({
  mockUseQueryParam: vi.fn(),
}));

vi.mock('use-query-params', async (importOriginal) => ({
  ...(await importOriginal()),
  useQueryParam: mockUseQueryParam,
}));

vi.mock('../../config', () => ({
  PERSES_APP_CONFIG: { api_prefix: '/perses' },
}));

vi.mock('../../context/DarkMode', () => ({
  useDarkMode: (): { isDarkModeEnabled: boolean } => ({ isDarkModeEnabled: false }),
}));

vi.mock('../../utils/browser-size', () => ({
  useIsLaptopSize: (): boolean => false,
}));

vi.mock('../../context/Config', () => ({
  useConfigContext: (): {
    config: {
      security: { authentication: { providers: { oidc: Array<{ slug_id: string; name: string; issuer: string }> } } };
    };
  } => ({
    config: {
      security: {
        authentication: {
          providers: {
            oidc: [{ slug_id: 'keycloak', name: 'Keycloak', issuer: 'https://keycloak.example.com/realms/myrealm' }],
          },
        },
      },
    },
  }),
  useIsNativeAuthnProviderEnabled: (): boolean => false,
}));

function signInWithKeycloak(): void {
  const theme = createTheme();
  render(
    <ThemeProvider theme={theme}>
      <SignWrapper>{null}</SignWrapper>
    </ThemeProvider>,
  );

  fireEvent.click(screen.getByText('Sign in with Keycloak'));
}

describe('SignWrapper', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  // rd must carry the absolute path (including api_prefix), since the backend's OIDC redirect is a raw
  // browser navigation that doesn't go through React Router's basename resolution.
  it('prefixes the OIDC login redirect with the configured api_prefix', () => {
    mockUseQueryParam.mockReturnValue([undefined]);

    signInWithKeycloak();

    expect(window.location.href).toEqual('/perses/api/auth/providers/oidc/keycloak/login?rd=%2Fperses');
  });

  it('prefixes the router-relative rd query param with the configured api_prefix', () => {
    mockUseQueryParam.mockReturnValue(['/explore?explorer=Prometheus-PrometheusExplorer']);

    signInWithKeycloak();

    expect(window.location.href).toEqual(
      '/perses/api/auth/providers/oidc/keycloak/login?rd=%2Fperses%2Fexplore%3Fexplorer%3DPrometheus-PrometheusExplorer',
    );
  });
});
