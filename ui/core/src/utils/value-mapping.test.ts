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

import { ValueMapping } from '../model';
import { applyValueMapping } from './value-mapping';

describe('applyValueMapping', () => {
  it('should return the original value if no mappings are provided', () => {
    const result = applyValueMapping('test');
    expect(result).toEqual({ value: 'test' });
  });

  it('should map value based on Value mapping', () => {
    const mappings: ValueMapping[] = [
      {
        kind: 'Value',
        spec: {
          value: 'test',
          result: { value: 'mapped', color: 'red' },
        },
      },
    ];
    const result = applyValueMapping('test', mappings);
    expect(result).toEqual({ value: 'mapped', color: 'red' });
  });

  it('should map value based on Range mapping', () => {
    const mappings: ValueMapping[] = [
      {
        kind: 'Range',
        spec: {
          from: 1,
          to: 10,
          result: { value: 'in range', color: 'blue' },
        },
      },
    ];
    const result = applyValueMapping(5, mappings);
    expect(result).toEqual({ value: 'in range', color: 'blue' });
  });

  it('should map value based on Regex mapping', () => {
    const mappings: ValueMapping[] = [
      {
        kind: 'Regex',
        spec: {
          pattern: '^test.*',
          result: { value: 'regex match', color: 'green' },
        },
      },
    ];
    const result = applyValueMapping('test123', mappings);
    expect(result).toEqual({ value: 'regex match', color: 'green' });
  });

  it('should map value based on Misc mapping', () => {
    const mappings: ValueMapping[] = [
      {
        kind: 'Misc',
        spec: {
          value: 'empty',
          result: { value: 'is empty', color: 'yellow' },
        },
      },
    ];
    const result = applyValueMapping('', mappings);
    expect(result).toEqual({ value: 'is empty', color: 'yellow' });
  });

  it('should return the original value if no mapping matches', () => {
    const mappings: ValueMapping[] = [
      {
        kind: 'Value',
        spec: {
          value: 'no match',
          result: { value: 'mapped', color: 'red' },
        },
      },
    ];
    const result = applyValueMapping('test', mappings);
    expect(result).toEqual({ value: 'test' });
  });
});
