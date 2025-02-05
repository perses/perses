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
import { renderWithContext } from '../../test';
import { VariableProvider } from '../../context';
import { Panel, PanelProps } from './Panel';

jest.mock('@perses-dev/plugin-system', () => {
  return {
    ...jest.requireActual('@perses-dev/plugin-system'),
    useDataQueriesContext: jest.fn(() => ({ queryResults: [{ definition: { kind: 'TimeSeriesQuery' }, data: [] }] })),
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

  // Helper to render the panel with some context set
  const renderPanel = (
    definition?: PanelDefinition,
    editHandlers?: PanelProps['editHandlers'],
    panelOptions?: PanelProps['panelOptions']
  ): void => {
    definition ??= createTestPanel();

    renderWithContext(
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
    );
  };

  // Helper to get the panel once rendered
  const getPanel = (): HTMLElement => screen.getByTestId('panel');

  it('should render panel', async () => {
    renderPanel();

    const panel = getPanel();
    expect(panel).toBeInTheDocument();

    // Should diplay header with panel's title
    const header = screen.getByRole('banner');
    expect(header).toHaveTextContent('Fake Panel Title');

    // Should display chart's content from the fake panel plugin
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
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('This is a fake panel - bar');
  });

  it('shows panel link', async () => {
    renderPanel();

    const linkButton = screen.getByRole('link', { name: 'Example Link' });
    expect(linkButton).toBeInTheDocument();

    // Can hover to see panel description in tooltip
    userEvent.hover(linkButton);
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('This is a fake panel link - bar');
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
      queryResults: [{ isFetching: true }, { data: [] }],
    });

    renderPanel();
    expect(screen.queryByLabelText('loading')).toBeTruthy();
  });

  it('does not show a loading indicator if 2/2 queries are loading', () => {
    (useDataQueriesContext as jest.Mock).mockReturnValue({
      queryResults: [{ isFetching: true }, { isFetching: true }],
    });

    renderPanel();
    expect(screen.queryByLabelText('loading')).toBeFalsy();
  });

  it('shows query errors in the tooltip', () => {
    (useDataQueriesContext as jest.Mock).mockReturnValue({
      queryResults: [{ error: 'test error' }],
    });

    renderPanel();
    expect(screen.queryByLabelText('panel errors')).toBeTruthy();
  });
});
