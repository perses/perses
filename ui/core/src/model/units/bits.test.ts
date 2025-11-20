// Copyright 2025 The Perses Authors
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

import { formatValue } from './units';
import { UnitTestCase } from './types';

const BITS_TESTS: UnitTestCase[] = [
  {
    value: -1234,
    format: { unit: 'decbits' },
    expected: '-1.23 Kb',
  },
  {
    value: -1234,
    format: { unit: 'decbits', shortValues: false },
    expected: '-1,234 bits',
  },
  {
    value: -1234,
    format: { unit: 'decbits', shortValues: false, decimalPlaces: 4 },
    expected: '-1,234.0000 bits',
  },
  {
    value: -1234,
    format: { unit: 'decbits', shortValues: true },
    expected: '-1.23 Kb',
  },
  {
    value: -1234,
    format: { unit: 'decbits', shortValues: true, decimalPlaces: 4 },
    expected: '-1.2340 Kb',
  },
  { value: 0, format: { unit: 'bits' }, expected: '0 bits' },
  { value: 1, format: { unit: 'bits' }, expected: '1 bits' },
  {
    value: 10,
    format: { unit: 'decbits' },
    expected: '10 bits',
  },
  {
    value: 100,
    format: { unit: 'bits' },
    expected: '100 bits',
  },
  {
    value: 100,
    format: { unit: 'decbits' },
    expected: '100 bits',
  },
  {
    value: 1000,
    format: { unit: 'decbits' },
    expected: '1 Kb',
  },
  {
    value: 1000,
    format: { unit: 'decbits', shortValues: false },
    expected: '1,000 bits',
  },
  {
    value: 1024,
    format: { unit: 'bits' },
    expected: '1 Kib',
  },
  {
    value: 1024,
    format: { unit: 'bits', shortValues: false },
    expected: '1,024 bits',
  },
  {
    value: 1024,
    format: { unit: 'bits', decimalPlaces: 0 },
    expected: '1 Kib',
  },
  {
    value: 1024,
    format: { unit: 'bits', decimalPlaces: 3 },
    expected: '1.000 Kib',
  },
  {
    value: 1000000,
    format: { unit: 'decbits' },
    expected: '1 Mb',
  },
  {
    value: 1000000,
    format: { unit: 'decbits', shortValues: false },
    expected: '1,000,000 bits',
  },
  {
    value: 1048576,
    format: { unit: 'bits' },
    expected: '1 Mib',
  },
  {
    value: 1048576,
    format: { unit: 'bits', shortValues: false },
    expected: '1,048,576 bits',
  },
  {
    value: 1073741824,
    format: { unit: 'bits' },
    expected: '1 Gib',
  },
  {
    value: 1073741824,
    format: { unit: 'bits', shortValues: false },
    expected: '1,073,741,824 bits',
  },
  {
    value: 1000000000,
    format: { unit: 'decbits' },
    expected: '1 Gb',
  },
  {
    value: 1000000000,
    format: { unit: 'decbits', shortValues: false },
    expected: '1,000,000,000 bits',
  },
];

describe('formatBits', () => {
  it.each(BITS_TESTS)('formats $value with $format as $expected', ({ value, format, expected }) => {
    expect(formatValue(value, format)).toBe(expected);
  });
});
