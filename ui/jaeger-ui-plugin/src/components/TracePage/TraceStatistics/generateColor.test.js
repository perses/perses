// Copyright (c) 2020 The Jaeger Authors.
//
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

import generateColor from './generateColor';
import transformTraceData from '../../../model/transform-trace-data';
import { getColumnValuesSecondDropdown, getColumnValues } from './tableValues';

import testTrace from './tableValuesTestTrace/testTrace.json';

const transformedTrace = transformTraceData(testTrace);

describe('generateColor', () => {
  it('check generateColor to count, one NameSelector is selected', () => {
    let tableValue1 = getColumnValues('Service Name', transformedTrace);
    tableValue1 = generateColor(tableValue1, 'count', true);

    expect(tableValue1[0].isDetail).toBe(false);
    expect(tableValue1[0].count).toBe(8);
    expect(tableValue1[0].colorToPercent).toBe('rgb(248,70,70)');
    expect(tableValue1[1].isDetail).toBe(false);
    expect(tableValue1[1].count).toBe(3);
    expect(tableValue1[1].colorToPercent).toBe('rgb(248,173.75,173.75)');

    tableValue1 = generateColor(tableValue1, 'count', false);
    expect(tableValue1[0].isDetail).toBe(false);
    expect(tableValue1[0].count).toBe(8);
    expect(tableValue1[0].colorToPercent).toBe('transparent');
    expect(tableValue1[1].isDetail).toBe(false);
    expect(tableValue1[1].count).toBe(3);
    expect(tableValue1[1].colorToPercent).toBe('transparent');
  });

  it('check generateColor with total, one NameSelector is selected', () => {
    let tableValue1 = getColumnValues('Service Name', transformedTrace);
    tableValue1 = generateColor(tableValue1, 'total', true);

    expect(tableValue1[0].isDetail).toBe(false);
    expect(tableValue1[0].total).toBe(573);
    expect(tableValue1[0].colorToPercent).toBe('rgb(248,70,70)');
    expect(tableValue1[1].isDetail).toBe(false);
    expect(tableValue1[1].total).toBe(238);
    expect(tableValue1[1].colorToPercent).toBe('rgb(248,167.05061082024432,167.05061082024432)');

    tableValue1 = generateColor(tableValue1, 'count', false);
    expect(tableValue1[0].isDetail).toBe(false);
    expect(tableValue1[0].total).toBe(573);
    expect(tableValue1[0].colorToPercent).toBe('transparent');
    expect(tableValue1[1].isDetail).toBe(false);
    expect(tableValue1[1].total).toBe(238);
    expect(tableValue1[1].colorToPercent).toBe('transparent');
  });

  it('check generarteColor with count, two NameSelectors are selected', () => {
    const tableValue1 = getColumnValues('Service Name', transformedTrace);
    let tableValue2 = getColumnValuesSecondDropdown(
      tableValue1,
      'Service Name',
      'Operation Name',
      transformedTrace
    );

    tableValue2 = generateColor(tableValue2, 'count', true);

    expect(tableValue2[0].isDetail).toBe(false);
    expect(tableValue2[0].count).toBe(8);
    expect(tableValue2[0].colorToPercent).toBe('rgb(248,70,70)');
    expect(tableValue2[1].isDetail).toBe(true);
    expect(tableValue2[1].count).toBe(1);
    expect(tableValue2[1].colorToPercent).toBe('rgb(248,215.25,215.25)');

    tableValue2 = generateColor(tableValue2, 'count', false);

    expect(tableValue2[0].isDetail).toBe(false);
    expect(tableValue2[0].count).toBe(8);
    expect(tableValue2[0].colorToPercent).toBe('transparent');
    expect(tableValue2[1].isDetail).toBe(true);
    expect(tableValue2[1].count).toBe(1);
    expect(tableValue2[1].colorToPercent).toBe('rgb(248,248,248)');
  });

  it('check generateColor with total, two NameSelectors are selcted', () => {
    const tableValue1 = getColumnValues('Service Name', transformedTrace);
    let tableValue2 = getColumnValuesSecondDropdown(
      tableValue1,
      'Service Name',
      'Operation Name',
      transformedTrace
    );

    tableValue2 = generateColor(tableValue2, 'total', true);

    expect(tableValue2[0].isDetail).toBe(false);
    expect(tableValue2[0].total).toBe(573);
    expect(tableValue2[0].colorToPercent).toBe('rgb(248,70,70)');
    expect(tableValue2[1].isDetail).toBe(true);
    expect(tableValue2[1].total).toBe(390);
    expect(tableValue2[1].colorToPercent).toBe('rgb(248,123.01570680628271,123.01570680628271)');

    tableValue2 = generateColor(tableValue2, 'total', false);

    expect(tableValue2[0].isDetail).toBe(false);
    expect(tableValue2[0].total).toBe(573);
    expect(tableValue2[0].colorToPercent).toBe('transparent');
    expect(tableValue2[1].isDetail).toBe(true);
    expect(tableValue2[1].total).toBe(390);
    expect(tableValue2[1].colorToPercent).toBe('rgb(248,248,248)');
  });
});
