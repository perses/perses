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

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PanelDefinition } from '@perses-dev/core';
import { DataQueriesProvider, TimeRangeProvider, useDataQueriesContext } from '@perses-dev/plugin-system';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { renderWithContext } from '../../test';
import { VariableProvider } from '../../context';
import { Panel, PanelProps } from './Panel';

const testTheme = createTheme({
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
        disableTouchRipple: true,
      },
    },
    MuiButton: {
      defaultProps: {
        disableRipple: true,
        disableTouchRipple: true,
      },
    },
    MuiIconButton: {
      defaultProps: {
        disableRipple: true,
        disableTouchRipple: true,
      },
    },
  },
  transitions: {
    create: () => 'none',
  },
});

jest.mock('@perses-dev/components', () => ({
  ...jest.requireActual('@perses-dev/components'),
  InfoTooltip: ({ children, description }: { children: React.ReactNode; description: string }): JSX.Element => (
    <>
      {children}
      <div role="tooltip">{description}</div>
    </>
  ),
}));

jest.mock('@mui/material/CircularProgress', () => {
  return function MockCircularProgress(props: { 'aria-label'?: string }): JSX.Element {
    return <div aria-label={props['aria-label'] || 'loading'} />;
  };
});

jest.mock('@perses-dev/plugin-system', () => {
  return {
    ...jest.requireActual('@perses-dev/plugin-system'),
    useDataQueriesContext: jest.fn(() => ({
      queryResults: [],
      isFetching: false,
      errors: [],
    })),
    usePluginRegistry: jest.fn(() => ({
      getPlugin: jest.fn((): { PanelComponent: () => JSX.Element } => ({
        PanelComponent: (): JSX.Element => <div>TimeSeriesChart panel</div>,
      })),
    })),
  };
});

describe('Panel', () => {
  const createTestPanel = (): PanelDefinition => ({
    kind: 'Panel',
    spec: {
      display: {
        name: 'Fake Panel Title - $foo',
        description: 'This is a fake panel - $foo',
      },
      plugin: {
        kind: 'TimeSeriesChart',
        spec: {},
      },
      queries: [],
      links: [
        {
          url: 'https://example.com',
          name: 'Example Link',
          tooltip: 'This is a fake panel link - $foo',
          targetBlank: true,
          renderVariables: true,
        },
      ],
    },
  });

  const renderPanel = (
    definition?: PanelDefinition,
    editHandlers?: PanelProps['editHandlers'],
    panelOptions?: PanelProps['panelOptions']
  ): void => {
    definition ??= createTestPanel();

    renderWithContext(
      <ThemeProvider theme={testTheme}>
        <TimeRangeProvider timeRange={{ pastDuration: '1h' }}>
          <VariableProvider
            initialVariableDefinitions={[
              {
                kind: 'TextVariable',
                spec: {
                  name: 'foo',
                  value: 'bar ',
                },
              },
            ]}
          >
            <DataQueriesProvider definitions={[]}>
              <Panel definition={definition} editHandlers={editHandlers} panelOptions={panelOptions} />
            </DataQueriesProvider>
          </VariableProvider>
        </TimeRangeProvider>
      </ThemeProvider>
    );
  };

  const getPanel = (): HTMLElement => screen.getByTestId('panel');

  it('should render panel', async () => {
    renderPanel();

    const panel = getPanel();
    expect(panel).toBeInTheDocument();

    const header = screen.getByRole('banner');
    expect(header).toHaveTextContent('Fake Panel Title');

    const content = screen.getByRole('figure');
    await waitFor(() => {
      expect(content).toHaveTextContent('TimeSeriesChart panel');
    });
    expect(content);
  });

  it('shows panel description', async () => {
    renderPanel();

    const descriptionButton = screen.getByRole('button', { name: /description/i });
    expect(descriptionButton).toBeInTheDocument();

    // Can hover to see panel description in tooltip
    userEvent.hover(descriptionButton);

    const tooltip = await screen.findByRole('tooltip', { name: 'This is a fake panel - bar' });
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('This is a fake panel - bar');
    expect(descriptionButton.querySelector('svg')).toHaveAttribute('aria-describedby', 'info-tooltip');
  });

  it('shows panel link', async () => {
    renderPanel();

    const linkButton = screen.getByRole('link', { name: 'Example Link' });
    expect(linkButton).toBeInTheDocument();

    // Can hover to see panel description in tooltip
    userEvent.hover(linkButton);

    const tooltip = await screen.findByRole('tooltip', { name: 'This is a fake panel link - bar' });
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('This is a fake panel link - bar');
    expect(linkButton).toHaveAttribute('href', 'https://example.com');
    expect(linkButton).toHaveAttribute('target', '_blank');
  });

  it('does not show description when panel does not have one', () => {
    // Render a panel without a description set
    const withoutDescription = createTestPanel();
    withoutDescription.spec.display.description = undefined;
    renderPanel(withoutDescription);

    const panel = getPanel();
    userEvent.hover(panel);
    const descriptionButton = screen.queryByRole('button', { name: /description/i });
    expect(descriptionButton).not.toBeInTheDocument();
  });

  it('does not show description when description only contains whitespace', () => {
    // Render a panel with an all whitespace description
    const withoutDescription = createTestPanel();
    withoutDescription.spec.display.description = '   ';
    renderPanel(withoutDescription);

    const panel = getPanel();
    userEvent.hover(panel);
    const descriptionButton = screen.queryByRole('button', { name: /description/i });
    expect(descriptionButton).not.toBeInTheDocument();
  });

  it('can trigger panel actions in edit mode', () => {
    const onEditPanelClick = jest.fn();
    const onDeletePanelClick = jest.fn();
    const onDuplicatePanelClick = jest.fn();
    renderPanel(undefined, { onEditPanelClick, onDeletePanelClick, onDuplicatePanelClick });

    const panel = getPanel();
    userEvent.hover(panel);

    const editButton = screen.getByRole('button', { name: /edit/i });
    userEvent.click(editButton);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    userEvent.click(deleteButton);

    const duplicateButton = screen.getByRole('button', { name: /duplicate/i });
    userEvent.click(duplicateButton);

    expect(onEditPanelClick).toHaveBeenCalledTimes(1);
    expect(onDeletePanelClick).toHaveBeenCalledTimes(1);
    expect(onDuplicatePanelClick).toHaveBeenCalledTimes(1);
  });

  it('should render extra panel content when not in edit mode', () => {
    renderPanel(undefined, undefined, {
      extra: () => <div>Extra content</div>,
    });
    const panel = getPanel();
    expect(panel).toHaveTextContent('Extra content');
  });

  it('should not render extra panel content when not in edit mode', () => {
    const onEditPanelClick = jest.fn();
    const onDeletePanelClick = jest.fn();
    const onDuplicatePanelClick = jest.fn();
    renderPanel(
      undefined,
      { onEditPanelClick, onDeletePanelClick, onDuplicatePanelClick },
      {
        extra: () => <div>Extra content</div>,
      }
    );
    const panel = getPanel();
    expect(panel).not.toHaveTextContent('Extra content');
  });

  it('shows loading indicator if 1/2 queries are loading', () => {
    (useDataQueriesContext as jest.Mock).mockReturnValue({
      isFetching: true,
      errors: [],
      queryResults: [{ data: { series: [{ name: 'test', values: [[1, 2]] }] }, isFetching: true }],
    });

    renderPanel();
    expect(screen.queryAllByLabelText('loading').length).toBeGreaterThan(0);
  });

  it('does not show a loading indicator if 2/2 queries are loading', () => {
    (useDataQueriesContext as jest.Mock).mockReturnValue({
      isFetching: true,
      errors: [],
      queryResults: [],
    });

    renderPanel();
    expect(screen.queryAllByLabelText('loading')).toHaveLength(0);
  });

  it('shows query errors in the tooltip', () => {
    (useDataQueriesContext as jest.Mock).mockReturnValue({
      isFetching: false,
      errors: ['test error'],
      queryResults: [{ error: 'test error' }],
    });

    renderPanel();
    expect(screen.queryAllByLabelText('panel errors').length).toBeGreaterThan(0);
  });
});
