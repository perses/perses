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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { vi } from 'vitest';

import type { LabelExplorerProps } from './LabelExplorer';
import { LabelExplorer } from './LabelExplorer';
import type { LabelFilter } from './log-selector';

const client = {
  labels: vi.fn(() => Promise.resolve({ data: ['env', 'service_name'] })),
  labelValues: vi.fn(({ labelName }: { labelName: string }) =>
    Promise.resolve({ data: labelName === 'service_name' ? ['api', 'web'] : ['dev', 'prod'] }),
  ),
};

vi.mock('@perses-dev/plugin-system', () => ({
  useDatasourceClient: (): object => ({ data: client }),
  useTimeRange: (): object => ({
    absoluteTimeRange: { start: new Date('2026-01-01T00:00:00Z'), end: new Date('2026-01-01T01:00:00Z') },
  }),
}));

function renderLabelExplorer(props: Partial<LabelExplorerProps> = {}): LabelExplorerProps {
  const allProps: LabelExplorerProps = {
    datasource: { kind: 'LokiDatasource' },
    filters: [],
    onToggleValue: vi.fn(),
    onOperatorChange: vi.fn(),
    ...props,
  };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = (): ReactElement => (
    <QueryClientProvider client={queryClient}>
      <LabelExplorer {...allProps} />
    </QueryClientProvider>
  );
  render(view());
  return allProps;
}

async function expandLabel(label: string): Promise<HTMLElement> {
  userEvent.click(await screen.findByRole('button', { name: new RegExp(`^${label}`) }));
  return screen.findByRole('list', { name: `Values of ${label}` });
}

describe('LabelExplorer', () => {
  it('lists and filters the labels', async () => {
    renderLabelExplorer();
    expect(await screen.findByRole('button', { name: 'env' })).toBeInTheDocument();
    userEvent.type(screen.getByRole('textbox', { name: 'Filter labels' }), 'serv');
    expect(screen.queryByRole('button', { name: 'env' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'service_name' })).toBeInTheDocument();
  });

  it('selects a value with its operator', async () => {
    const props = renderLabelExplorer();
    const values = await expandLabel('service_name');
    userEvent.click(await within(values).findByRole('button', { name: 'web' }));
    expect(props.onToggleValue).toHaveBeenCalledWith('service_name', 'web', '=');

    fireEvent.mouseDown(within(values).getByRole('combobox', { name: 'Operator for service_name api' }));
    userEvent.click(await screen.findByRole('option', { name: '!=' }));
    userEvent.click(within(values).getByRole('button', { name: 'api' }));
    expect(props.onToggleValue).toHaveBeenCalledWith('service_name', 'api', '!=');
    expect(props.onOperatorChange).not.toHaveBeenCalled();
  });

  it('highlights selected values and changes their operator', async () => {
    const filters: LabelFilter[] = [{ label: 'service_name', operator: '=~', values: ['web'] }];
    const props = renderLabelExplorer({ filters });
    expect(await screen.findByRole('button', { name: 'service_name (1)' })).toBeInTheDocument();

    const values = await expandLabel('service_name');
    expect(await within(values).findByRole('button', { name: 'web' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(values).getByRole('button', { name: 'api' })).toHaveAttribute('aria-pressed', 'false');

    fireEvent.mouseDown(within(values).getByRole('combobox', { name: 'Operator for service_name web' }));
    userEvent.click(await screen.findByRole('option', { name: '!~' }));
    expect(props.onOperatorChange).toHaveBeenCalledWith('service_name', 'web', '!~');
  });

  it('explains when the query cannot be shown as label filters', async () => {
    renderLabelExplorer({ filters: undefined });
    expect(await screen.findByText(/Custom query/)).toBeInTheDocument();
  });
});
