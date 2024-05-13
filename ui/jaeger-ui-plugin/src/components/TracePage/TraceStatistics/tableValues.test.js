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

import transformTraceData from '../../../model/transform-trace-data';
import { getColumnValues, getColumnValuesSecondDropdown } from './tableValues';

import testTraceNormal from './tableValuesTestTrace/testTraceNormal.json';
import traceSpanAmongEachOther from './tableValuesTestTrace/spansAmongEachOther.json';
import traceSpanAmongEachOtherGrouped from './tableValuesTestTrace/spansAmongEachOtherGrouped.json';
import traceSpanAmongEachOtherGroupedAndSpans from './tableValuesTestTrace/spanAmongEachOtherGroupedAndSpans.json';
import traceSpanLongerAsParent from './tableValuesTestTrace/spanLongerAsParent.json';
import traceWithOverlappingChildrenLongerThanParent from './tableValuesTestTrace/traceWithOverlappingChildrenLongerThanParent.json';
import traceWithTwoNonOverlappingChildren from './tableValuesTestTrace/traceWithTwoNonOverlappingChildren.json';
import traceWithOverlappingChildren from './tableValuesTestTrace/traceWithOverlappingChildren.json';
import traceWithSingleChildLongerThanParentAndStartsAfterParent from './tableValuesTestTrace/traceWithSingleChildLongerThanParentAndStartsAfterParent.json';
import traceWithThreeShortChildren from './tableValuesTestTrace/traceWithThreeShortChildren.json';
import traceWithTwoChildrenStartedAtTraceStart from './tableValuesTestTrace/traceWithTwoChildrenStartedAtTraceStart.json';

const transformedTrace = transformTraceData(testTraceNormal);
const transformedTraceSpanAmongEachOthe = transformTraceData(traceSpanAmongEachOther);
const transformedTraceSpanAmongEachOtheGrouped = transformTraceData(traceSpanAmongEachOtherGrouped);
const transformedTraceSpanAmongEachOtheGroupedAndSpans = transformTraceData(
  traceSpanAmongEachOtherGroupedAndSpans
);
const transformedTraceSpanLongerAsParent = transformTraceData(traceSpanLongerAsParent);
const transformedTraceWithOverlappingChildrenLongerThanParent = transformTraceData(
  traceWithOverlappingChildrenLongerThanParent
);
const transformedTraceWithTwoNonOverlappingChildren = transformTraceData(traceWithTwoNonOverlappingChildren);
const transformedTraceWithOverlappingChildren = transformTraceData(traceWithOverlappingChildren);
const transformedtraceWithSingleChildLongerThanParentAndStartsAfterParent = transformTraceData(
  traceWithSingleChildLongerThanParentAndStartsAfterParent
);
const transformedTraceWithThreeShortChildren = transformTraceData(traceWithThreeShortChildren);
const transformedTraceWithTwoChildrenStartedAtTraceStart = transformTraceData(
  traceWithTwoChildrenStartedAtTraceStart
);

describe('tableValues', () => {
  it('get values only first nameSelector is selected (Service Name)', () => {
    const resultArray = getColumnValues('Service Name', transformedTrace);

    expect(resultArray[0].count).toBe(2);
    expect(resultArray[0].total).toBe(7.4);
    expect(resultArray[0].avg).toBe(3.7);
    expect(resultArray[0].min).toBe(2.5);
    expect(resultArray[0].max).toBe(4.9);
    expect(resultArray[0].selfTotal).toBe(3.16);
    expect(resultArray[0].selfAvg).toBe(1.58);
    expect(resultArray[0].selfMin).toBe(0.76);
    expect(resultArray[0].selfMax).toBe(2.4);
    expect(resultArray[0].percent).toBe(64.52);

    expect(resultArray[1].count).toBe(3);
    expect(resultArray[1].total).toBe(1.81);
    expect(resultArray[1].avg).toBe(0.6);
    expect(resultArray[1].min).toBe(0.02);
    expect(resultArray[1].max).toBe(1.74);
    expect(resultArray[1].selfTotal).toBe(1.74);
    expect(resultArray[1].selfAvg).toBe(0.58);
    expect(resultArray[1].selfMin).toBe(0.02);
    expect(resultArray[1].selfMax).toBe(1.67);
    expect(resultArray[1].percent).toBe(35.48);
  });

  it('get values only first dropdown is selected (Operation Name', () => {
    const resultArray = getColumnValues('Operation Name', transformedTrace);

    expect(resultArray[0].count).toBe(1);
    expect(resultArray[0].total).toBe(4.9);
    expect(resultArray[0].avg).toBe(4.9);
    expect(resultArray[0].min).toBe(4.9);
    expect(resultArray[0].max).toBe(4.9);
    expect(resultArray[0].selfTotal).toBe(2.4);
    expect(resultArray[0].selfAvg).toBe(2.4);
    expect(resultArray[0].selfMin).toBe(2.4);
    expect(resultArray[0].selfMax).toBe(2.4);
    expect(resultArray[0].percent).toBe(49.02);

    expect(resultArray[1].count).toBe(2);
    expect(resultArray[1].total).toBe(4.24);
    expect(resultArray[1].avg).toBe(2.12);
    expect(resultArray[1].min).toBe(1.74);
    expect(resultArray[1].max).toBe(2.5);
    expect(resultArray[1].selfTotal).toBe(2.43);
    expect(resultArray[1].selfAvg).toBe(1.21);
    expect(resultArray[1].selfMin).toBe(0.76);
    expect(resultArray[1].selfMax).toBe(1.67);
    expect(resultArray[1].percent).toBe(49.49);

    expect(resultArray[2].count).toBe(2);
    expect(resultArray[2].total).toBe(0.07);
    expect(resultArray[2].avg).toBe(0.04);
    expect(resultArray[2].min).toBe(0.02);
    expect(resultArray[2].max).toBe(0.05);
    expect(resultArray[2].selfTotal).toBe(0.07);
    expect(resultArray[2].selfAvg).toBe(0.04);
    expect(resultArray[2].selfMin).toBe(0.02);
    expect(resultArray[2].selfMax).toBe(0.05);
    expect(resultArray[2].percent).toBe(1.49);
  });

  it('get values only first dropdown is selected (Tag)', () => {
    const resultArray = getColumnValues('database', transformedTrace);

    expect(resultArray[0].count).toBe(2);
    expect(resultArray[0].total).toBe(0.07);
    expect(resultArray[0].avg).toBe(0.04);
    expect(resultArray[0].min).toBe(0.02);
    expect(resultArray[0].max).toBe(0.05);
    expect(resultArray[0].selfTotal).toBe(0.07);
    expect(resultArray[0].selfAvg).toBe(0.04);
    expect(resultArray[0].selfMin).toBe(0.02);
    expect(resultArray[0].selfMax).toBe(0.05);
    expect(resultArray[0].percent).toBe(1.49);

    expect(resultArray[1].count).toBe(3);
    expect(resultArray[1].total).toBe(9.14);
    expect(resultArray[1].avg).toBe(3.05);
    expect(resultArray[1].min).toBe(1.74);
    expect(resultArray[1].max).toBe(4.9);
    expect(resultArray[1].selfTotal).toBe(4.83);
    expect(resultArray[1].selfAvg).toBe(1.61);
    expect(resultArray[1].selfMin).toBe(0.76);
    expect(resultArray[1].selfMax).toBe(2.4);
    expect(resultArray[1].percent).toBe(98.51);
  });

  it('get values two dropdowns are selected (Service Name, Operation Name', () => {
    let resultArray = getColumnValues('Service Name', transformedTrace);

    resultArray = getColumnValuesSecondDropdown(
      resultArray,
      'Service Name',
      'Operation Name',
      transformedTrace
    );

    expect(resultArray[0].count).toBe(2);
    expect(resultArray[0].total).toBe(7.4);
    expect(resultArray[0].avg).toBe(3.7);
    expect(resultArray[0].min).toBe(2.5);
    expect(resultArray[0].max).toBe(4.9);
    expect(resultArray[0].selfTotal).toBe(3.16);
    expect(resultArray[0].selfAvg).toBe(1.58);
    expect(resultArray[0].selfMin).toBe(0.76);
    expect(resultArray[0].selfMax).toBe(2.4);
    expect(resultArray[0].percent).toBe(64.52);

    expect(resultArray[1].count).toBe(1);
    expect(resultArray[1].total).toBe(4.9);
    expect(resultArray[1].avg).toBe(4.9);
    expect(resultArray[1].min).toBe(4.9);
    expect(resultArray[1].max).toBe(4.9);
    expect(resultArray[1].selfTotal).toBe(2.4);
    expect(resultArray[1].selfAvg).toBe(2.4);
    expect(resultArray[1].selfMin).toBe(2.4);
    expect(resultArray[1].selfMax).toBe(2.4);
    expect(resultArray[1].percent).toBe(49.02);

    expect(resultArray[2].count).toBe(1);
    expect(resultArray[2].total).toBe(2.5);
    expect(resultArray[2].avg).toBe(2.5);
    expect(resultArray[2].min).toBe(2.5);
    expect(resultArray[2].max).toBe(2.5);
    expect(resultArray[2].selfTotal).toBe(0.76);
    expect(resultArray[2].selfAvg).toBe(0.76);
    expect(resultArray[2].selfMin).toBe(0.76);
    expect(resultArray[2].selfMax).toBe(0.76);
    expect(resultArray[2].percent).toBe(15.5);

    expect(resultArray[3].count).toBe(3);
    expect(resultArray[3].total).toBe(1.81);
    expect(resultArray[3].avg).toBe(0.6);
    expect(resultArray[3].min).toBe(0.02);
    expect(resultArray[3].max).toBe(1.74);
    expect(resultArray[3].selfTotal).toBe(1.74);
    expect(resultArray[3].selfAvg).toBe(0.58);
    expect(resultArray[3].selfMin).toBe(0.02);
    expect(resultArray[3].selfMax).toBe(1.67);
    expect(resultArray[3].percent).toBe(35.48);

    expect(resultArray[4].count).toBe(1);
    expect(resultArray[4].total).toBe(1.74);
    expect(resultArray[4].avg).toBe(1.74);
    expect(resultArray[4].min).toBe(1.74);
    expect(resultArray[4].max).toBe(1.74);
    expect(resultArray[4].selfTotal).toBe(1.67);
    expect(resultArray[4].selfAvg).toBe(1.67);
    expect(resultArray[4].selfMin).toBe(1.67);
    expect(resultArray[4].selfMax).toBe(1.67);
    expect(resultArray[4].percent).toBe(33.99);

    expect(resultArray[5].count).toBe(2);
    expect(resultArray[5].total).toBe(0.07);
    expect(resultArray[5].avg).toBe(0.04);
    expect(resultArray[5].min).toBe(0.02);
    expect(resultArray[5].max).toBe(0.05);
    expect(resultArray[5].selfTotal).toBe(0.07);
    expect(resultArray[5].selfAvg).toBe(0.04);
    expect(resultArray[5].selfMin).toBe(0.02);
    expect(resultArray[5].selfMax).toBe(0.05);
    expect(resultArray[5].percent).toBe(1.49);
  });

  it('get values two dropdowns are selected (Operation Name, Service Name', () => {
    let resultArray = getColumnValues('Operation Name', transformedTrace);

    resultArray = getColumnValuesSecondDropdown(
      resultArray,
      'Operation Name',
      'Service Name',
      transformedTrace
    );

    expect(resultArray[0].count).toBe(1);
    expect(resultArray[0].total).toBe(4.9);
    expect(resultArray[0].avg).toBe(4.9);
    expect(resultArray[0].min).toBe(4.9);
    expect(resultArray[0].max).toBe(4.9);
    expect(resultArray[0].selfTotal).toBe(2.4);
    expect(resultArray[0].selfAvg).toBe(2.4);
    expect(resultArray[0].selfMin).toBe(2.4);
    expect(resultArray[0].selfMax).toBe(2.4);
    expect(resultArray[0].percent).toBe(49.02);

    expect(resultArray[1].count).toBe(1);
    expect(resultArray[1].total).toBe(4.9);
    expect(resultArray[1].avg).toBe(4.9);
    expect(resultArray[1].min).toBe(4.9);
    expect(resultArray[1].max).toBe(4.9);
    expect(resultArray[1].selfTotal).toBe(2.4);
    expect(resultArray[1].selfAvg).toBe(2.4);
    expect(resultArray[1].selfMin).toBe(2.4);
    expect(resultArray[1].selfMax).toBe(2.4);
    expect(resultArray[1].percent).toBe(49.02);

    expect(resultArray[2].count).toBe(2);
    expect(resultArray[2].total).toBe(4.24);
    expect(resultArray[2].avg).toBe(2.12);
    expect(resultArray[2].min).toBe(1.74);
    expect(resultArray[2].max).toBe(2.5);
    expect(resultArray[2].selfTotal).toBe(2.43);
    expect(resultArray[2].selfAvg).toBe(1.21);
    expect(resultArray[2].selfMin).toBe(0.76);
    expect(resultArray[2].selfMax).toBe(1.67);
    expect(resultArray[2].percent).toBe(49.49);

    expect(resultArray[3].count).toBe(1);
    expect(resultArray[3].total).toBe(2.5);
    expect(resultArray[3].avg).toBe(2.5);
    expect(resultArray[3].min).toBe(2.5);
    expect(resultArray[3].max).toBe(2.5);
    expect(resultArray[3].selfTotal).toBe(0.76);
    expect(resultArray[3].selfAvg).toBe(0.76);
    expect(resultArray[3].selfMin).toBe(0.76);
    expect(resultArray[3].selfMax).toBe(0.76);
    expect(resultArray[3].percent).toBe(15.5);

    expect(resultArray[4].count).toBe(1);
    expect(resultArray[4].total).toBe(1.74);
    expect(resultArray[4].avg).toBe(1.74);
    expect(resultArray[4].min).toBe(1.74);
    expect(resultArray[4].max).toBe(1.74);
    expect(resultArray[4].selfTotal).toBe(1.67);
    expect(resultArray[4].selfAvg).toBe(1.67);
    expect(resultArray[4].selfMin).toBe(1.67);
    expect(resultArray[4].selfMax).toBe(1.67);
    expect(resultArray[4].percent).toBe(33.99);

    expect(resultArray[5].count).toBe(2);
    expect(resultArray[5].total).toBe(0.07);
    expect(resultArray[5].avg).toBe(0.04);
    expect(resultArray[5].min).toBe(0.02);
    expect(resultArray[5].max).toBe(0.05);
    expect(resultArray[5].selfTotal).toBe(0.07);
    expect(resultArray[5].selfAvg).toBe(0.04);
    expect(resultArray[5].selfMin).toBe(0.02);
    expect(resultArray[5].selfMax).toBe(0.05);
    expect(resultArray[5].percent).toBe(1.49);

    expect(resultArray[6].count).toBe(2);
    expect(resultArray[6].total).toBe(0.07);
    expect(resultArray[6].avg).toBe(0.04);
    expect(resultArray[6].min).toBe(0.02);
    expect(resultArray[6].max).toBe(0.05);
    expect(resultArray[6].selfTotal).toBe(0.07);
    expect(resultArray[6].selfAvg).toBe(0.04);
    expect(resultArray[6].selfMin).toBe(0.02);
    expect(resultArray[6].selfMax).toBe(0.05);
    expect(resultArray[6].percent).toBe(1.49);
  });

  it('get values two dropdowns are selected (Tag, Service Name)', () => {
    let resultArray = getColumnValues('database', transformedTrace);

    resultArray = getColumnValuesSecondDropdown(resultArray, 'database', 'Service Name', transformedTrace);

    expect(resultArray[0].count).toBe(2);
    expect(resultArray[0].total).toBe(0.07);
    expect(resultArray[0].avg).toBe(0.04);
    expect(resultArray[0].min).toBe(0.02);
    expect(resultArray[0].max).toBe(0.05);
    expect(resultArray[0].selfTotal).toBe(0.07);
    expect(resultArray[0].selfAvg).toBe(0.04);
    expect(resultArray[0].selfMin).toBe(0.02);
    expect(resultArray[0].selfMax).toBe(0.05);
    expect(resultArray[0].percent).toBe(1.49);

    expect(resultArray[1].count).toBe(2);
    expect(resultArray[1].total).toBe(0.07);
    expect(resultArray[1].avg).toBe(0.04);
    expect(resultArray[1].min).toBe(0.02);
    expect(resultArray[1].max).toBe(0.05);
    expect(resultArray[1].selfTotal).toBe(0.07);
    expect(resultArray[1].selfAvg).toBe(0.04);
    expect(resultArray[1].selfMin).toBe(0.02);
    expect(resultArray[1].selfMax).toBe(0.05);
    expect(resultArray[1].percent).toBe(1.49);

    expect(resultArray[2].count).toBe(3);
    expect(resultArray[2].total).toBe(9.14);
    expect(resultArray[2].avg).toBe(3.05);
    expect(resultArray[2].min).toBe(1.74);
    expect(resultArray[2].max).toBe(4.9);
    expect(resultArray[2].selfTotal).toBe(4.83);
    expect(resultArray[2].selfAvg).toBe(1.61);
    expect(resultArray[2].selfMin).toBe(0.76);
    expect(resultArray[2].selfMax).toBe(2.4);
    expect(resultArray[2].percent).toBe(98.51);
  });

  it('get values two dropdowns are selected (Service Name, Tag)', () => {
    let resultArray = getColumnValues('Service Name', transformedTrace);

    resultArray = getColumnValuesSecondDropdown(resultArray, 'Service Name', 'database', transformedTrace);

    expect(resultArray[0].count).toBe(2);
    expect(resultArray[0].total).toBe(7.4);
    expect(resultArray[0].avg).toBe(3.7);
    expect(resultArray[0].min).toBe(2.5);
    expect(resultArray[0].max).toBe(4.9);
    expect(resultArray[0].selfTotal).toBe(3.16);
    expect(resultArray[0].selfAvg).toBe(1.58);
    expect(resultArray[0].selfMin).toBe(0.76);
    expect(resultArray[0].selfMax).toBe(2.4);
    expect(resultArray[0].percent).toBe(64.52);

    expect(resultArray[1].count).toBe(2);
    expect(resultArray[1].total).toBe(7.4);
    expect(resultArray[1].avg).toBe(3.7);
    expect(resultArray[1].min).toBe(2.5);
    expect(resultArray[1].max).toBe(4.9);
    expect(resultArray[1].selfTotal).toBe(3.16);
    expect(resultArray[1].selfAvg).toBe(1.58);
    expect(resultArray[1].selfMin).toBe(0.76);
    expect(resultArray[1].selfMax).toBe(2.4);
    expect(resultArray[1].percent).toBe(64.52);

    expect(resultArray[2].count).toBe(3);
    expect(resultArray[2].total).toBe(1.81);
    expect(resultArray[2].avg).toBe(0.6);
    expect(resultArray[2].min).toBe(0.02);
    expect(resultArray[2].max).toBe(1.74);
    expect(resultArray[2].selfTotal).toBe(1.74);
    expect(resultArray[2].selfAvg).toBe(0.58);
    expect(resultArray[2].selfMin).toBe(0.02);
    expect(resultArray[2].selfMax).toBe(1.67);
    expect(resultArray[2].percent).toBe(35.48);

    expect(resultArray[3].count).toBe(1);
    expect(resultArray[3].total).toBe(1.74);
    expect(resultArray[3].avg).toBe(1.74);
    expect(resultArray[3].min).toBe(1.74);
    expect(resultArray[3].max).toBe(1.74);
    expect(resultArray[3].selfTotal).toBe(1.67);
    expect(resultArray[3].selfAvg).toBe(1.67);
    expect(resultArray[3].selfMin).toBe(1.67);
    expect(resultArray[3].selfMax).toBe(1.67);
    expect(resultArray[3].percent).toBe(33.99);

    expect(resultArray[4].count).toBe(2);
    expect(resultArray[4].total).toBe(0.07);
    expect(resultArray[4].avg).toBe(0.04);
    expect(resultArray[4].min).toBe(0.02);
    expect(resultArray[4].max).toBe(0.05);
    expect(resultArray[4].selfTotal).toBe(0.07);
    expect(resultArray[4].selfAvg).toBe(0.04);
    expect(resultArray[4].selfMin).toBe(0.02);
    expect(resultArray[4].selfMax).toBe(0.05);
    expect(resultArray[4].percent).toBe(1.49);
  });

  it('get values two dropdowns are selected (Tag, Tag)', () => {
    let resultArray = getColumnValues('database', transformedTrace);

    resultArray = getColumnValuesSecondDropdown(resultArray, 'database', 'sql', transformedTrace);

    expect(resultArray[0].count).toBe(2);
    expect(resultArray[0].total).toBe(0.07);
    expect(resultArray[0].avg).toBe(0.04);
    expect(resultArray[0].min).toBe(0.02);
    expect(resultArray[0].max).toBe(0.05);
    expect(resultArray[0].selfTotal).toBe(0.07);
    expect(resultArray[0].selfAvg).toBe(0.04);
    expect(resultArray[0].selfMin).toBe(0.02);
    expect(resultArray[0].selfMax).toBe(0.05);
    expect(resultArray[0].percent).toBe(1.49);

    expect(resultArray[1].count).toBe(1);
    expect(resultArray[1].total).toBe(0.02);
    expect(resultArray[1].avg).toBe(0.02);
    expect(resultArray[1].min).toBe(0.02);
    expect(resultArray[1].max).toBe(0.02);
    expect(resultArray[1].selfTotal).toBe(0.02);
    expect(resultArray[1].selfAvg).toBe(0.02);
    expect(resultArray[1].selfMin).toBe(0.02);
    expect(resultArray[1].selfMax).toBe(0.02);
    expect(resultArray[1].percent).toBe(0.43);

    expect(resultArray[2].count).toBe(1);
    expect(resultArray[2].total).toBe(0.05);
    expect(resultArray[2].avg).toBe(0.05);
    expect(resultArray[2].min).toBe(0.05);
    expect(resultArray[2].max).toBe(0.05);
    expect(resultArray[2].selfTotal).toBe(0.05);
    expect(resultArray[2].selfAvg).toBe(0.05);
    expect(resultArray[2].selfMin).toBe(0.05);
    expect(resultArray[2].selfMax).toBe(0.05);
    expect(resultArray[2].percent).toBe(1.06);

    expect(resultArray[3].count).toBe(3);
    expect(resultArray[3].total).toBe(9.14);
    expect(resultArray[3].avg).toBe(3.05);
    expect(resultArray[3].min).toBe(1.74);
    expect(resultArray[3].max).toBe(4.9);
    expect(resultArray[3].selfTotal).toBe(4.83);
    expect(resultArray[3].selfAvg).toBe(1.61);
    expect(resultArray[3].selfMin).toBe(0.76);
    expect(resultArray[3].selfMax).toBe(2.4);
    expect(resultArray[3].percent).toBe(98.51);
  });
});

describe('check self time', () => {
  it('spans among each other', () => {
    let resultArray = getColumnValues('Service Name', transformedTraceSpanAmongEachOthe);

    resultArray = getColumnValuesSecondDropdown(
      resultArray,
      'Service Name',
      'Operation Name',
      transformedTraceSpanAmongEachOthe
    );

    expect(resultArray[4].selfTotal).toBe(1.67);
  });

  it('spans among each other', () => {
    let resultArray = getColumnValues('Service Name', transformedTraceSpanAmongEachOtheGrouped);
    resultArray = getColumnValuesSecondDropdown(
      resultArray,
      'Service Name',
      'Operation Name',
      transformedTraceSpanAmongEachOtheGrouped
    );
    expect(resultArray[4].selfTotal).toBe(1.63);
  });

  it(' spans among each other and two other children', () => {
    let resultArray = getColumnValues('Service Name', transformedTraceSpanAmongEachOtheGroupedAndSpans);
    resultArray = getColumnValuesSecondDropdown(
      resultArray,
      'Service Name',
      'Operation Name',
      transformedTraceSpanAmongEachOtheGroupedAndSpans
    );
    expect(resultArray[4].selfTotal).toBe(1.56);
  });

  it(' span is longer as parent', () => {
    let resultArray = getColumnValues('Service Name', transformedTraceSpanLongerAsParent);
    resultArray = getColumnValuesSecondDropdown(
      resultArray,
      'Service Name',
      'Operation Name',
      transformedTraceSpanLongerAsParent
    );

    expect(resultArray[2].selfTotal).toBe(1.22);
  });

  it('span with two overlapping children longer than their parent and a third short child span', () => {
    const [serviceOne] = getColumnValues(
      'Service Name',
      transformedTraceWithOverlappingChildrenLongerThanParent
    );
    expect(serviceOne.selfTotal).toBe(0.03);
  });

  it('span with two children that do not overlap and one is longer than its parent', () => {
    const [serviceOne] = getColumnValues('Service Name', transformedTraceWithTwoNonOverlappingChildren);
    expect(serviceOne.selfTotal).toBe(0.03);
  });

  it('span with two overlapping children where one is longer than its parent', () => {
    const [serviceOne] = getColumnValues('Service Name', transformedTraceWithOverlappingChildren);
    expect(serviceOne.selfTotal).toBe(0);
  });

  it('span with single child span longer than its parent', () => {
    const [serviceOne] = getColumnValues(
      'Service Name',
      transformedtraceWithSingleChildLongerThanParentAndStartsAfterParent
    );
    expect(serviceOne.selfTotal).toBe(0.04);
  });

  it('span with three children shorter than their parent, two of which overlap', () => {
    const [serviceOne] = getColumnValues('Service Name', transformedTraceWithThreeShortChildren);
    expect(serviceOne.selfTotal).toBe(0.01);
  });

  it('span with two children started at trace start time', () => {
    const [serviceOne] = getColumnValues('Service Name', transformedTraceWithTwoChildrenStartedAtTraceStart);
    expect(serviceOne.selfTotal).toBe(0);
  });
});
