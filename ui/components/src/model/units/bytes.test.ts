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

import { UnitTestCase } from './units.test';

export const bytesTests: UnitTestCase[] = [
  { value: 0, unit: { kind: 'Bytes' }, expected: '0 bytes' },
  { value: 1, unit: { kind: 'Bytes' }, expected: '1 byte' },
  {
    value: 10,
    unit: { kind: 'Bytes' },
    expected: '10 bytes',
  },
  {
    value: 10,
    unit: { kind: 'Bytes', abbreviate: false },
    expected: '10 bytes',
  },
  {
    value: 10,
    unit: { kind: 'Bytes', abbreviate: false, decimal_places: 4 },
    expected: '10 bytes',
  },
  {
    value: 10,
    unit: { kind: 'Bytes', abbreviate: true },
    expected: '10 bytes',
  },
  {
    value: 10,
    unit: { kind: 'Bytes', abbreviate: true, decimal_places: 4 },
    expected: '10 bytes',
  },
  {
    value: 1000,
    unit: { kind: 'Bytes' },
    expected: '1 KB',
  },
  {
    value: 1000,
    unit: { kind: 'Bytes', abbreviate: false },
    expected: '1,000 bytes',
  },
  {
    value: 1000,
    unit: { kind: 'Bytes', abbreviate: false, decimal_places: 4 },
    expected: '1,000 bytes',
  },
  {
    value: 1000,
    unit: { kind: 'Bytes', abbreviate: true },
    expected: '1 KB',
  },
  {
    value: 1000,
    unit: { kind: 'Bytes', abbreviate: true, decimal_places: 4 },
    expected: '1 KB',
  },
  {
    value: 1234,
    unit: { kind: 'Bytes' },
    expected: '1.23 KB',
  },
  {
    value: 1234,
    unit: { kind: 'Bytes', abbreviate: false },
    expected: '1,234 bytes',
  },
  {
    value: 1234,
    unit: { kind: 'Bytes', abbreviate: false, decimal_places: 4 },
    expected: '1,234 bytes',
  },
  {
    value: 1234,
    unit: { kind: 'Bytes', abbreviate: true },
    expected: '1.23 KB',
  },
  {
    value: 1234,
    unit: { kind: 'Bytes', abbreviate: true, decimal_places: 4 },
    expected: '1.234 KB',
  },
  {
    value: 100000,
    unit: { kind: 'Bytes' },
    expected: '100 KB',
  },
  {
    value: 100000,
    unit: { kind: 'Bytes', abbreviate: false },
    expected: '100,000 bytes',
  },
  {
    value: 100000,
    unit: { kind: 'Bytes', abbreviate: false, decimal_places: 4 },
    expected: '100,000 bytes',
  },
  {
    value: 100000,
    unit: { kind: 'Bytes', abbreviate: true },
    expected: '100 KB',
  },
  {
    value: 100000,
    unit: { kind: 'Bytes', abbreviate: true, decimal_places: 4 },
    expected: '100 KB',
  },
  {
    value: 123456,
    unit: { kind: 'Bytes' },
    expected: '123.46 KB',
  },
  {
    value: 123456,
    unit: { kind: 'Bytes', abbreviate: false },
    expected: '123,456 bytes',
  },
  {
    value: 123456,
    unit: { kind: 'Bytes', abbreviate: false, decimal_places: 4 },
    expected: '123,456 bytes',
  },
  {
    value: 123456,
    unit: { kind: 'Bytes', abbreviate: true },
    expected: '123.46 KB',
  },
  {
    value: 123456,
    unit: { kind: 'Bytes', abbreviate: true, decimal_places: 4 },
    expected: '123.456 KB',
  },
  {
    value: 10000000,
    unit: { kind: 'Bytes' },
    expected: '10 MB',
  },
  {
    value: 10000000,
    unit: { kind: 'Bytes', abbreviate: false },
    expected: '10,000,000 bytes',
  },
  {
    value: 10000000,
    unit: { kind: 'Bytes', abbreviate: false, decimal_places: 4 },
    expected: '10,000,000 bytes',
  },
  {
    value: 10000000,
    unit: { kind: 'Bytes', abbreviate: true },
    expected: '10 MB',
  },
  {
    value: 10000000,
    unit: { kind: 'Bytes', abbreviate: true, decimal_places: 4 },
    expected: '10 MB',
  },
  {
    value: 12345678,
    unit: { kind: 'Bytes' },
    expected: '12.35 MB',
  },
  {
    value: 12345678,
    unit: { kind: 'Bytes', abbreviate: false },
    expected: '12,345,678 bytes',
  },
  {
    value: 12345678,
    unit: { kind: 'Bytes', abbreviate: false, decimal_places: 4 },
    expected: '12,345,678 bytes',
  },
  {
    value: 12345678,
    unit: { kind: 'Bytes', abbreviate: true },
    expected: '12.35 MB',
  },
  {
    value: 12345678,
    unit: { kind: 'Bytes', abbreviate: true, decimal_places: 4 },
    expected: '12.3457 MB',
  },
  {
    value: 1000000000,
    unit: { kind: 'Bytes' },
    expected: '1 GB',
  },
  {
    value: 1000000000,
    unit: { kind: 'Bytes', abbreviate: false },
    expected: '1,000,000,000 bytes',
  },
  {
    value: 1000000000,
    unit: { kind: 'Bytes', abbreviate: false, decimal_places: 4 },
    expected: '1,000,000,000 bytes',
  },
  {
    value: 1000000000,
    unit: { kind: 'Bytes', abbreviate: true },
    expected: '1 GB',
  },
  {
    value: 1000000000,
    unit: { kind: 'Bytes', abbreviate: true, decimal_places: 4 },
    expected: '1 GB',
  },
  {
    value: 1234567890,
    unit: { kind: 'Bytes' },
    expected: '1.23 GB',
  },
  {
    value: 1234567890,
    unit: { kind: 'Bytes', abbreviate: false },
    expected: '1,234,567,890 bytes',
  },
  {
    value: 1234567890,
    unit: { kind: 'Bytes', abbreviate: false, decimal_places: 4 },
    expected: '1,234,567,890 bytes',
  },
  {
    value: 1234567890,
    unit: { kind: 'Bytes', abbreviate: true },
    expected: '1.23 GB',
  },
  {
    value: 1234567890,
    unit: { kind: 'Bytes', abbreviate: true, decimal_places: 4 },
    expected: '1.2346 GB',
  },
];
