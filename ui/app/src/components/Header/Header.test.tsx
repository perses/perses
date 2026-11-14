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

import { ThemeProvider } from '@mui/material';
import { getTheme } from '@perses-dev/components';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import type { LogoConfig } from '../../model/config-client';
import Header from './Header';

const { mockUseLogo, mockUseIsLaptopSize } = vi.hoisted(() => ({
  mockUseLogo: vi.fn<() => LogoConfig | undefined>(),
  mockUseIsLaptopSize: vi.fn<() => boolean>(),
}));

vi.mock('../../context/Config', () => ({
  useIsAuthEnabled: (): boolean => false,
  useIsExplorerEnabled: (): boolean => false,
  useLogo: mockUseLogo,
}));

vi.mock('../../context/Authorization', () => ({
  GlobalProject: '',
  useHasPartialPermission: (): boolean => false,
}));

vi.mock('../../utils/browser-size', () => ({
  useIsLaptopSize: mockUseIsLaptopSize,
  useIsMobileSize: (): boolean => false,
}));

vi.mock('../BannerInfo', () => ({
  BannerInfo: (): null => null,
}));

vi.mock('./SearchBar/SearchBar', () => ({
  SearchBar: (): null => null,
}));

vi.mock('./ThemeSwitch', () => ({
  ThemeSwitch: (): null => null,
}));

function renderHeader(): HTMLElement {
  const { container } = render(
    <ThemeProvider theme={getTheme('light')}>
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    </ThemeProvider>,
  );
  return container;
}

describe('Header', () => {
  beforeEach(() => {
    mockUseIsLaptopSize.mockReturnValue(true);
  });

  it('displays the Perses logo when no custom logo is configured', () => {
    mockUseLogo.mockReturnValue(undefined);

    const container = renderHeader();

    expect(screen.queryByRole('img', { name: 'Home' })).not.toBeInTheDocument();
    expect(container.querySelector('a[href="/"] svg')).toBeInTheDocument();
  });

  it('displays the custom navbar logo when it is configured', () => {
    mockUseLogo.mockReturnValue({ navbar_url: 'https://example.com/navbar-logo.png' });

    const container = renderHeader();

    expect(screen.getByRole('img', { name: 'Home' })).toHaveAttribute('src', 'https://example.com/navbar-logo.png');
    expect(container.querySelector('a[href="/"] svg')).not.toBeInTheDocument();
  });

  it('displays the custom navbar logo on smaller screens too', () => {
    mockUseIsLaptopSize.mockReturnValue(false);
    mockUseLogo.mockReturnValue({ navbar_url: 'https://example.com/navbar-logo.png' });

    renderHeader();

    expect(screen.getByRole('img', { name: 'Home' })).toHaveAttribute('src', 'https://example.com/navbar-logo.png');
  });

  it('keeps the Perses logo when only the sign-in logo is configured', () => {
    mockUseLogo.mockReturnValue({ sign_in_url: 'https://example.com/sign-in-logo.png' });

    const container = renderHeader();

    expect(screen.queryByRole('img', { name: 'Home' })).not.toBeInTheDocument();
    expect(container.querySelector('a[href="/"] svg')).toBeInTheDocument();
  });

  it('falls back to the Perses logo when the custom navbar logo fails to load', () => {
    mockUseLogo.mockReturnValue({ navbar_url: 'https://example.com/navbar-logo.png' });

    const container = renderHeader();
    fireEvent.error(screen.getByRole('img', { name: 'Home' }));

    expect(screen.queryByRole('img', { name: 'Home' })).not.toBeInTheDocument();
    expect(container.querySelector('a[href="/"] svg')).toBeInTheDocument();
  });
});
