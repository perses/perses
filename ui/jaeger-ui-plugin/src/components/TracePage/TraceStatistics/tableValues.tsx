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

import memoizeOne from 'memoize-one';
import _uniq from 'lodash/uniq';
import DRange from 'drange';
import { Trace, Span } from '../../../types/trace';
import { ITableSpan } from './types';
import colorGenerator from '../../../utils/color-generator';

const serviceName = 'Service Name';
const operationName = 'Operation Name';

function parentChildOfMap(allSpans: Span[]): Record<string, Span[]> {
  const parentChildOfMap: Record<string, Span[]> = {};
  allSpans.forEach(s => {
    if (s.references) {
      // Filter for CHILD_OF we don't want to calculate FOLLOWS_FROM (prod-cons)
      const parentIDs = s.references.filter(r => r.refType === 'CHILD_OF').map(r => r.spanID);
      parentIDs.forEach((pID: string) => {
        parentChildOfMap[pID] = parentChildOfMap[pID] || [];
        parentChildOfMap[pID].push(s);
      });
    }
  });
  return parentChildOfMap;
}

const memoizedParentChildOfMap = memoizeOne(parentChildOfMap);

function getChildOfSpans(parentID: string, allSpans: Span[]): Span[] {
  return memoizedParentChildOfMap(allSpans)[parentID] || [];
}

function computeSelfTime(span: Span, allSpans: Span[]): number {
  if (!span.hasChildren) return span.duration;
  // We want to represent spans as half-open intervals like [startTime, startTime + duration).
  // This way the subtraction preserves the right boundaries. However, DRange treats all
  // intervals as inclusive. For example,
  //       range(1, 10).subtract(4, 8) => range([1, 3], [9-10])
  //       length=(3-1)+(10-9)=2+1=3
  // In other words, we took an interval of length=10-1=9 and subtracted length=8-4=4.
  // We should've ended up with length 9-4=5, but we got 3.
  // To work around that, we multiply start/end times by 10 and subtract one from the end.
  // So instead of [1-10] we get [10-99]. This makes the intervals work like half-open.
  const spanRange = new DRange(10 * span.startTime, 10 * (span.startTime + span.duration) - 1);
  const children = getChildOfSpans(span.spanID, allSpans);
  children.forEach(child => {
    spanRange.subtract(10 * child.startTime, 10 * (child.startTime + child.duration) - 1);
  });
  return Math.round(spanRange.length / 10);
}

function computeColumnValues(trace: Trace, span: Span, allSpans: Span[], resultValue: any) {
  const resultValueChange = resultValue;
  resultValueChange.count += 1;
  resultValueChange.total += span.duration;
  if (resultValueChange.min > span.duration) {
    resultValueChange.min = span.duration;
  }
  if (resultValueChange.max < span.duration) {
    resultValueChange.max = span.duration;
  }

  const tempSelf = computeSelfTime(span, allSpans);
  if (resultValueChange.selfMin > tempSelf) {
    resultValueChange.selfMin = tempSelf;
  }
  if (resultValueChange.selfMax < tempSelf) {
    resultValueChange.selfMax = tempSelf;
  }
  resultValueChange.selfTotal += tempSelf;

  const onePercent = 100 / trace.duration;
  resultValueChange.percent = resultValueChange.selfTotal * onePercent;

  return resultValueChange;
}

/**
 * Builds an obeject which represents a column.
 */
function buildOneColumn(oneColumn: ITableSpan) {
  const oneColumnChange = oneColumn;
  oneColumnChange.total = Math.round((oneColumnChange.total / 1000) * 100) / 100;
  oneColumnChange.avg = Math.round((oneColumnChange.avg / 1000) * 100) / 100;
  oneColumnChange.min = Math.round((oneColumnChange.min / 1000) * 100) / 100;
  oneColumnChange.max = Math.round((oneColumnChange.max / 1000) * 100) / 100;
  oneColumnChange.selfTotal = Math.round((oneColumnChange.selfTotal / 1000) * 100) / 100;
  oneColumnChange.selfAvg = Math.round((oneColumnChange.selfAvg / 1000) * 100) / 100;
  oneColumnChange.selfMin = Math.round((oneColumnChange.selfMin / 1000) * 100) / 100;
  oneColumnChange.selfMax = Math.round((oneColumnChange.selfMax / 1000) * 100) / 100;
  oneColumnChange.percent = Math.round((oneColumnChange.percent / 1) * 100) / 100;
  // oneColumnChange.colorToPercent;
  return oneColumnChange;
}

/**
 * Is used if only one dropdown is selected.
 */
function valueFirstDropdown(selectedTagKey: string, trace: Trace) {
  let color = '';
  let allDiffColumnValues = [];
  const allSpans = trace.spans;
  // all possibilities that can be displayed
  if (selectedTagKey === serviceName) {
    allDiffColumnValues = _uniq(allSpans.map(x => x.process.serviceName));
  } else if (selectedTagKey === operationName) {
    allDiffColumnValues = _uniq(allSpans.map(x => x.operationName));
  } else {
    for (let i = 0; i < allSpans.length; i++) {
      for (let j = 0; j < allSpans[i].tags.length; j++) {
        if (allSpans[i].tags[j].key === selectedTagKey) {
          allDiffColumnValues.push(allSpans[i].tags[j].value);
        }
      }
    }
    allDiffColumnValues = _uniq(allDiffColumnValues);
  }
  // used to build the table
  const allTableValues = [];
  const spanWithNoSelectedTag = []; // is only needed when there are Others
  for (let i = 0; i < allDiffColumnValues.length; i++) {
    let resultValue = {
      selfTotal: 0,
      selfMin: trace.duration,
      selfMax: 0,
      selfAvg: 0,
      total: 0,
      avg: 0,
      min: trace.duration,
      max: 0,
      count: 0,
      percent: 0,
    };
    for (let j = 0; j < allSpans.length; j++) {
      if (selectedTagKey === serviceName) {
        if (allSpans[j].process.serviceName === allDiffColumnValues[i]) {
          resultValue = computeColumnValues(trace, allSpans[j], allSpans, resultValue);
          color = colorGenerator.getColorByKey(allSpans[j].process.serviceName);
        }
      } else if (selectedTagKey === operationName) {
        if (allSpans[j].operationName === allDiffColumnValues[i]) {
          resultValue = computeColumnValues(trace, allSpans[j], allSpans, resultValue);
        }
      } else {
        // used when a tag is selected
        for (let l = 0; l < allSpans[j].tags.length; l++) {
          if (allSpans[j].tags[l].value === allDiffColumnValues[i]) {
            resultValue = computeColumnValues(trace, allSpans[j], allSpans, resultValue);
          }
        }
      }
    }
    resultValue.selfAvg = resultValue.selfTotal / resultValue.count;
    resultValue.avg = resultValue.total / resultValue.count;
    let tableSpan = {
      hasSubgroupValue: true,
      name: allDiffColumnValues[i],
      count: resultValue.count,
      total: resultValue.total,
      avg: resultValue.avg,
      min: resultValue.min,
      max: resultValue.max,
      isDetail: false,
      selfTotal: resultValue.selfTotal,
      selfAvg: resultValue.selfAvg,
      selfMin: resultValue.selfMin,
      selfMax: resultValue.selfMax,
      percent: resultValue.percent,
      color,
      searchColor: '',
      parentElement: 'none',
      colorToPercent: 'tranparent',
      traceID: '',
    };
    tableSpan = buildOneColumn(tableSpan);
    allTableValues.push(tableSpan);
  }
  // checks if there is OTHERS
  if (selectedTagKey !== serviceName && selectedTagKey !== operationName) {
    for (let i = 0; i < allSpans.length; i++) {
      let isIn = false;
      for (let j = 0; j < allSpans[i].tags.length; j++) {
        for (let l = 0; l < allDiffColumnValues.length; l++) {
          if (allSpans[i].tags[j].value === allDiffColumnValues[l]) {
            isIn = true;
          }
        }
      }
      if (!isIn) {
        spanWithNoSelectedTag.push(allSpans[i]);
      }
    }
    // Others is calculated
    let resultValue = {
      selfTotal: 0,
      selfAvg: 0,
      selfMin: trace.duration,
      selfMax: 0,
      total: 0,
      avg: 0,
      min: trace.duration,
      max: 0,
      count: 0,
      percent: 0,
    };
    for (let i = 0; i < spanWithNoSelectedTag.length; i++) {
      resultValue = computeColumnValues(trace, spanWithNoSelectedTag[i], allSpans, resultValue);
    }
    if (resultValue.count !== 0) {
      // Others is build
      resultValue.selfAvg = resultValue.selfTotal / resultValue.count;
      resultValue.avg = resultValue.total / resultValue.count;
      let tableSpanOTHERS = {
        hasSubgroupValue: false,
        name: `Without Tag: ${selectedTagKey}`,
        count: resultValue.count,
        total: resultValue.total,
        avg: resultValue.avg,
        min: resultValue.min,
        max: resultValue.max,
        isDetail: false,
        selfTotal: resultValue.selfTotal,
        selfAvg: resultValue.selfAvg,
        selfMin: resultValue.selfMin,
        selfMax: resultValue.selfMax,
        percent: resultValue.percent,
        color: '',
        searchColor: 'transparent',
        parentElement: '',
        colorToPercent: 'rgb(248,248,248)',
        traceID: '',
      };
      tableSpanOTHERS = buildOneColumn(tableSpanOTHERS);
      allTableValues.push(tableSpanOTHERS);
    }
  }
  return allTableValues;
}

/**
 * Creates columns for the children.
 */
function buildDetail(
  diffNamesA: string[],
  tempArray: Span[],
  allSpans: Span[],
  selectedTagKeySecond: string,
  parentName: string,
  isDetail: boolean,
  trace: Trace
) {
  const newColumnValues = [];
  for (let j = 0; j < diffNamesA.length; j++) {
    let color = '';
    let resultValue = {
      selfTotal: 0,
      selfAvg: 0,
      selfMin: trace.duration,
      selfMax: 0,
      total: 0,
      avg: 0,
      min: trace.duration,
      max: 0,
      count: 0,
      percent: 0,
    };
    for (let l = 0; l < tempArray.length; l++) {
      if (isDetail) {
        for (let a = 0; a < tempArray[l].tags.length; a++) {
          if (diffNamesA[j] === tempArray[l].tags[a].value) {
            resultValue = computeColumnValues(trace, tempArray[l], allSpans, resultValue);
          }
        }
      } else if (selectedTagKeySecond === serviceName) {
        if (diffNamesA[j] === tempArray[l].process.serviceName) {
          resultValue = computeColumnValues(trace, tempArray[l], allSpans, resultValue);
          color = colorGenerator.getColorByKey(tempArray[l].process.serviceName);
        }
      } else if (diffNamesA[j] === tempArray[l].operationName) {
        resultValue = computeColumnValues(trace, tempArray[l], allSpans, resultValue);
      }
    }
    resultValue.selfAvg = resultValue.selfTotal / resultValue.count;
    resultValue.avg = resultValue.total / resultValue.count;
    let buildOneColumnValue = {
      hasSubgroupValue: true,
      name: diffNamesA[j],
      count: resultValue.count,
      total: resultValue.total,
      avg: resultValue.avg,
      min: resultValue.min,
      max: resultValue.max,
      isDetail: true,
      selfTotal: resultValue.selfTotal,
      selfAvg: resultValue.selfAvg,
      selfMin: resultValue.selfMin,
      selfMax: resultValue.selfMax,
      percent: resultValue.percent,
      color,
      searchColor: '',
      parentElement: parentName,
      colorToPercent: 'rgb(248,248,248)',
      traceID: '',
    };
    buildOneColumnValue = buildOneColumn(buildOneColumnValue);
    newColumnValues.push(buildOneColumnValue);
  }
  return newColumnValues;
}

/**
 * Used to generate detail rest.
 */
function generateDetailRest(allColumnValues: ITableSpan[], selectedTagKeySecond: string, trace: Trace) {
  const allSpans = trace.spans;
  const newTable = [];
  for (let i = 0; i < allColumnValues.length; i++) {
    newTable.push(allColumnValues[i]);
    if (!allColumnValues[i].isDetail) {
      let resultValue = {
        selfTotal: 0,
        selfAvg: 0,
        selfMin: trace.duration,
        selfMax: 0,
        total: 0,
        avg: 0,
        min: trace.duration,
        max: 0,
        count: 0,
        percent: 0,
      };
      for (let j = 0; j < allSpans.length; j++) {
        if (
          allColumnValues[i].name === allSpans[j].process.serviceName ||
          allColumnValues[i].name === allSpans[j].operationName
        ) {
          let rest = true;
          for (let l = 0; l < allSpans[j].tags.length; l++) {
            if (allSpans[j].tags[l].key === selectedTagKeySecond) {
              rest = false;
              break;
            }
          }
          if (rest) {
            resultValue = computeColumnValues(trace, allSpans[j], allSpans, resultValue);
          }
        }
      }
      resultValue.avg = resultValue.total / resultValue.count;
      resultValue.selfAvg = resultValue.selfTotal / resultValue.count;
      if (resultValue.count !== 0) {
        let buildOneColumnValue = {
          hasSubgroupValue: false,
          name: `Without Tag: ${selectedTagKeySecond}`,
          count: resultValue.count,
          total: resultValue.total,
          avg: resultValue.avg,
          min: resultValue.min,
          max: resultValue.max,
          isDetail: true,
          selfTotal: resultValue.selfTotal,
          selfAvg: resultValue.selfAvg,
          selfMin: resultValue.selfMin,
          selfMax: resultValue.selfMax,
          percent: resultValue.percent,
          color: '',
          searchColor: '',
          parentElement: allColumnValues[i].name,
          colorToPercent: 'rgb(248,248,248)',
          traceID: '',
        };
        buildOneColumnValue = buildOneColumn(buildOneColumnValue);
        newTable.push(buildOneColumnValue);
      }
    }
  }
  return newTable;
}

/**
 * Used to get values if the second dropdown is selected.
 */
function valueSecondDropdown(
  actualTableValues: ITableSpan[],
  selectedTagKey: string,
  selectedTagKeySecond: string,
  trace: Trace
) {
  const allSpans = trace.spans;
  const allTableValues = [];

  for (let i = 0; i < actualTableValues.length; i++) {
    // if the table is already in the detail view, then these entries are not considered
    if (!actualTableValues[i].isDetail) {
      const tempArray = [];
      let diffNamesA = [] as any;
      // all Spans withe the same value (first dropdown)
      for (let j = 0; j < allSpans.length; j++) {
        if (selectedTagKey === serviceName) {
          if (actualTableValues[i].name === allSpans[j].process.serviceName) {
            tempArray.push(allSpans[j]);
            diffNamesA.push(allSpans[j].operationName);
          }
        } else if (selectedTagKey === operationName) {
          if (actualTableValues[i].name === allSpans[j].operationName) {
            tempArray.push(allSpans[j]);
            diffNamesA.push(allSpans[j].process.serviceName);
          }
          // if first dropdown is a tag
        } else {
          for (let l = 0; l < allSpans[j].tags.length; l++) {
            if (actualTableValues[i].name === allSpans[j].tags[l].value) {
              tempArray.push(allSpans[j]);
              if (selectedTagKeySecond === operationName) {
                diffNamesA.push(allSpans[j].operationName);
              } else if (selectedTagKeySecond === serviceName) {
                diffNamesA.push(allSpans[j].process.serviceName);
              }
            }
          }
        }
      }
      let newColumnValues = [] as any;
      // if second dropdown is no tag
      if (selectedTagKeySecond === serviceName || selectedTagKeySecond === operationName) {
        diffNamesA = _uniq(diffNamesA);
        newColumnValues = buildDetail(
          diffNamesA,
          tempArray,
          allSpans,
          selectedTagKeySecond,
          actualTableValues[i].name,
          false,
          trace
        );
      } else {
        // second dropdown is a tag
        diffNamesA = [] as any;
        for (let j = 0; j < tempArray.length; j++) {
          for (let l = 0; l < tempArray[j].tags.length; l++) {
            if (tempArray[j].tags[l].key === selectedTagKeySecond) {
              diffNamesA.push(tempArray[j].tags[l].value);
            }
          }
        }
        diffNamesA = _uniq(diffNamesA);
        newColumnValues = buildDetail(
          diffNamesA,
          tempArray,
          allSpans,
          selectedTagKeySecond,
          actualTableValues[i].name,
          true,
          trace
        );
      }
      allTableValues.push(actualTableValues[i]);
      if (newColumnValues.length > 0) {
        for (let j = 0; j < newColumnValues.length; j++) {
          allTableValues.push(newColumnValues[j]);
        }
      }
    }
  }
  // if second dropdown is a tag a rest must be created
  if (selectedTagKeySecond !== serviceName && selectedTagKeySecond !== operationName) {
    return generateDetailRest(allTableValues, selectedTagKeySecond, trace);
    // if no tag is selected the values can be returned
  }
  return allTableValues;
}

/**
 * Returns the values of the table shown after the selection of the first dropdown.
 * @param selectedTagKey the key which was selected
 */
export function getColumnValues(selectedTagKey: string, trace: Trace) {
  return valueFirstDropdown(selectedTagKey, trace);
}

/**
 * Returns the values of the table shown after the selection of the second dropdown.
 * @param actualTableValues actual values of the table
 * @param selectedTagKey first key which is selected
 * @param selectedTagKeySecond second key which is selected
 * @param trace whole information about the trace
 */
export function getColumnValuesSecondDropdown(
  actualTableValues: ITableSpan[],
  selectedTagKey: string,
  selectedTagKeySecond: string,
  trace: Trace
) {
  if (selectedTagKeySecond !== 'Reset') {
    return valueSecondDropdown(actualTableValues, selectedTagKey, selectedTagKeySecond, trace);
  }
  return getColumnValues(selectedTagKey, trace);
}
