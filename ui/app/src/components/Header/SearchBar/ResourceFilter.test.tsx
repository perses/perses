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

import { fireEvent, render, screen } from '@testing-library/react';

import { RESOURCE_TYPE_TITLES } from './model';
import type { ResourceType } from './model';
import { ResourceFilter } from './ResourceFilter';
import type { IProps } from './ResourceFilter';

const renderResourceFilter = ({ apply, appliedResources }: IProps): ReturnType<typeof render> => {
  return render(<ResourceFilter apply={apply} appliedResources={appliedResources} />);
};

describe('ResourceFilter', () => {
  describe('controls availability and interaction', () => {
    let apply = vitest.fn();
    const appliedResources = new Set<ResourceType>(['dashboards', 'datasources', 'globalDatasources', 'projects']);

    beforeEach(() => {
      apply = vitest.fn();
      renderResourceFilter({ apply, appliedResources });
      const resourceButton = screen.getByRole('button', { name: 'Resources' });
      fireEvent.click(resourceButton);
    });

    describe('buttons availability', () => {
      ['Apply', 'Cancel'].forEach((b) => {
        it(`should have ${b} button`, () => {
          expect(screen.getByRole('button', { name: b })).toBeTruthy();
        });
      });
    });

    describe('resource checkbox availability', () => {
      ['dashboards', 'datasources', 'globalDatasources', 'projects'].forEach((rt) => {
        it(`should have ${rt}`, () => {
          expect(screen.getByRole('checkbox', { name: RESOURCE_TYPE_TITLES[rt as ResourceType] })).toBeTruthy();
        });

        it(`should have ${rt} checked`, () => {
          const checkbox = screen.getByRole('checkbox', { name: RESOURCE_TYPE_TITLES[rt as ResourceType] });
          expect(checkbox).toHaveProperty('checked', true);
        });
      });
    });

    describe('interaction', () => {
      describe('uncheck resource', () => {
        ['dashboards', 'datasources', 'globalDatasources', 'projects'].forEach((rt) => {
          it(`should uncheck ${rt}`, () => {
            const checkbox = screen.getByRole('checkbox', { name: RESOURCE_TYPE_TITLES[rt as ResourceType] });
            fireEvent.click(checkbox);
            expect(checkbox).toHaveProperty('checked', false);
          });
        });
      });
    });

    it('should disable Apply', () => {
      ['dashboards', 'datasources', 'globalDatasources', 'projects'].forEach((rt) => {
        const checkbox = screen.getByRole('checkbox', { name: RESOURCE_TYPE_TITLES[rt as ResourceType] });
        fireEvent.click(checkbox);
      });
      const applyButton = screen.getByRole('button', { name: 'Apply' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(applyButton).toHaveProperty('disabled', true);
      expect(cancelButton).toHaveProperty('disabled', false);
    });

    it('should close the filter (Cancel button)', () => {
      expect(screen.getByRole('dialog')).toBeTruthy();
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);
      expect(screen.queryByRole('dialog')).not.toBeTruthy();
    });

    it('should call Apply', () => {
      const applyButton = screen.getByRole('button', { name: 'Apply' });
      fireEvent.click(applyButton);
      expect(apply).toHaveBeenCalledOnce();
      expect(apply).toHaveBeenCalledWith(new Set(['dashboards', 'datasources', 'globalDatasources', 'projects']));
      expect(screen.queryByRole('dialog')).not.toBeTruthy();
    });

    it('should not call Apply', () => {
      ['dashboards', 'datasources', 'globalDatasources', 'projects'].forEach((rt) => {
        const checkbox = screen.getByRole('checkbox', { name: RESOURCE_TYPE_TITLES[rt as ResourceType] });
        fireEvent.click(checkbox);
      });
      const applyButton = screen.getByRole('button', { name: 'Apply' });
      expect(applyButton).toHaveProperty('disabled', true);
      fireEvent.click(applyButton);
      expect(apply).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).toBeTruthy();
    });

    it('should have been called with selected items', () => {
      ['dashboards', 'projects'].forEach((rt) => {
        const checkbox = screen.getByRole('checkbox', { name: RESOURCE_TYPE_TITLES[rt as ResourceType] });
        fireEvent.click(checkbox);
      });
      const applyButton = screen.getByRole('button', { name: 'Apply' });
      expect(applyButton).toHaveProperty('disabled', false);
      fireEvent.click(applyButton);
      expect(apply).toHaveBeenCalled();
      expect(apply).toHaveBeenCalledWith(new Set(['datasources', 'globalDatasources']));
      expect(screen.queryByRole('dialog')).not.toBeTruthy();
    });
  });
});
