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

import { PanelDefinition } from '@perses-dev/core';
import { getValidPanelKey } from './panelUtils';

describe('getValidPanelKey', () => {
  test('removes whitespace', () => {
    expect(getValidPanelKey('my panel name', {})).toBe('mypanelname');
  });

  test('does not include a counter if the key is not in use', () => {
    const mockPanelDefs = {
      alreadyInUse: {
        kind: 'Panel',
        spec: {},
      } as PanelDefinition,
    };
    expect(getValidPanelKey('newPanelName', mockPanelDefs)).toBe('newPanelName');
  });

  test('includes a counter if the key is already in use', () => {
    const mockPanelDefs = {
      alreadyInUse: {
        kind: 'Panel',
        spec: {},
      } as PanelDefinition,
    };
    expect(getValidPanelKey('alreadyInUse', mockPanelDefs)).toBe('alreadyInUse-1');
  });

  test('includes an incremented counter if the key is already in use multiple times', () => {
    const mockPanelDefs = {
      popularKey: {
        kind: 'Panel',
        spec: {},
      } as PanelDefinition,
      'popularKey-1': {
        kind: 'Panel',
        spec: {},
      } as PanelDefinition,
    };
    expect(getValidPanelKey('popularKey', mockPanelDefs)).toBe('popularKey-2');
    expect(getValidPanelKey('popularKey-1', mockPanelDefs)).toBe('popularKey-2');
  });

  test('does not duplicate counters when they are out of order', () => {
    const mockPanelDefs = {
      outoforder: {
        kind: 'Panel',
        spec: {},
      } as PanelDefinition,
      'outoforder-2': {
        kind: 'Panel',
        spec: {},
      } as PanelDefinition,
    };
    expect(getValidPanelKey('outoforder', mockPanelDefs)).toBe('outoforder-3');
    expect(getValidPanelKey('outoforder-2', mockPanelDefs)).toBe('outoforder-3');
  });
});
