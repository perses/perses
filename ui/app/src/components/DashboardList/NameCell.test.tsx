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

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { NameCell, NameCellProps } from './NameCell';

const theme = createTheme();

function renderCell(props: NameCellProps): ReturnType<typeof render> {
  return render(
    <ThemeProvider theme={theme}>
      <NameCell {...props} />
    </ThemeProvider>
  );
}

const noop = (): void => {};

describe('NameCell – Folder', () => {
  it('renders the display name', () => {
    renderCell({
      kind: 'Folder',
      depth: 0,
      displayName: 'My Folder',
      project: 'p',
      name: 'my-folder',
      isOpen: false,
      onToggleExpanded: noop,
    });
    expect(screen.getByText('My Folder')).toBeInTheDocument();
  });

  it('shows expand button with aria-expanded=false when closed', () => {
    renderCell({
      kind: 'Folder',
      depth: 0,
      displayName: 'F',
      project: 'p',
      name: 'f',
      isOpen: false,
      onToggleExpanded: noop,
    });
    const button = screen.getByRole('button', { name: 'expand folder' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows collapse button with aria-expanded=true when open', () => {
    renderCell({
      kind: 'Folder',
      depth: 0,
      displayName: 'F',
      project: 'p',
      name: 'f',
      isOpen: true,
      onToggleExpanded: noop,
    });
    const button = screen.getByRole('button', { name: 'collapse folder' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('calls onToggleExpanded when the button is clicked', () => {
    const onToggle = jest.fn();
    renderCell({
      kind: 'Folder',
      depth: 0,
      displayName: 'F',
      project: 'p',
      name: 'f',
      isOpen: false,
      onToggleExpanded: onToggle,
    });
    fireEvent.click(screen.getByRole('button', { name: 'expand folder' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('applies left padding based on depth', () => {
    const { container } = renderCell({
      kind: 'Folder',
      depth: 2,
      displayName: 'F',
      project: 'p',
      name: 'f',
      isOpen: false,
      onToggleExpanded: noop,
    });
    const box = container.firstChild as HTMLElement;
    expect(box).toHaveStyle({ paddingLeft: '48px' });
  });
});

describe('NameCell – Dashboard', () => {
  it('renders the display name as a link', () => {
    renderCell({
      kind: 'Dashboard',
      depth: 0,
      displayName: 'My Dashboard',
      project: 'myproj',
      name: 'my-dash',
      isOpen: false,
      onToggleExpanded: noop,
    });
    const link = screen.getByRole('link', { name: 'My Dashboard' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/projects/myproj/dashboards/my-dash');
  });

  it('applies left padding with one extra depth level for the chevron offset', () => {
    const { container } = renderCell({
      kind: 'Dashboard',
      depth: 1,
      displayName: 'D',
      project: 'p',
      name: 'd',
      isOpen: false,
      onToggleExpanded: noop,
    });
    const box = container.firstChild as HTMLElement;
    expect(box).toHaveStyle({ paddingLeft: '48px' });
  });
});

describe('NameCell – NoItems', () => {
  it('renders "No Items" text', () => {
    renderCell({
      kind: 'NoItems',
      depth: 0,
      displayName: '',
      project: 'p',
      name: '__no_items__',
      isOpen: false,
      onToggleExpanded: noop,
    });
    expect(screen.getByText('No Items')).toBeInTheDocument();
  });

  it('applies left padding based on depth', () => {
    const { container } = renderCell({
      kind: 'NoItems',
      depth: 2,
      displayName: '',
      project: 'p',
      name: '__no_items__',
      isOpen: false,
      onToggleExpanded: noop,
    });
    const box = container.firstChild as HTMLElement;
    expect(box).toHaveStyle({ paddingLeft: '72px' });
  });
});
