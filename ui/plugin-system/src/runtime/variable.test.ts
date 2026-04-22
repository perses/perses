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

import { VariableStoreStateMap } from '@perses-dev/plugin-system';

describe('VariableStoreStateMap', function () {
  let sut: VariableStoreStateMap;

  beforeEach(() => {
    sut = new VariableStoreStateMap();
    sut.set({ name: 'varA', source: 'srcA' }, { value: 'value1', loading: false });
    sut.set({ name: 'varA' }, { value: 'value2', loading: false });
  });

  test('check the update of the reference', function () {
    const ref = sut.get({ name: 'varA', source: 'srcA' });
    if (ref) {
      ref.loading = true;
    }
    expect(sut.get({ name: 'varA', source: 'srcA' })).toEqual({ value: 'value1', loading: true });
  });

  test('check has/get methods', function () {
    expect(sut.has({ name: 'varA' })).toEqual(true);
    expect(sut.get({ name: 'varA' })).toEqual({ value: 'value2', loading: false });

    expect(sut.has({ name: 'varA', source: '' })).toEqual(true);
    expect(sut.get({ name: 'varA', source: '' })).toEqual({ value: 'value2', loading: false });

    expect(sut.has({ name: 'varA', source: 'srcA' })).toEqual(true);
    expect(sut.get({ name: 'varA', source: 'srcA' })).toEqual({ value: 'value1', loading: false });

    expect(sut.has({ name: 'varB', source: 'srcA' })).toEqual(false);
    expect(sut.get({ name: 'varB', source: 'srcA' })).toEqual(undefined);
  });

  test('check delete methods', function () {
    expect(sut.delete({ name: 'varA' })).toEqual(true);
    expect(sut.delete({ name: 'varA', source: 'srcA' })).toEqual(true);

    expect(sut.has({ name: 'varA' })).toEqual(false);
    expect(sut.has({ name: 'varA', source: 'srcA' })).toEqual(false);
  });
});
