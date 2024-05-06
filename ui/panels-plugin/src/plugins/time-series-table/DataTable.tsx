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
/*
 eslint-disable @typescript-eslint/no-explicit-any
 */
import { Fragment, ReactNode } from 'react';
import { Table } from '@mui/material';
import { TimeSeries, TimeSeriesData } from '@perses-dev/core';
import { QueryData } from '@perses-dev/plugin-system';

export interface DataTableProps {
  result: Array<QueryData<TimeSeriesData>>;
}

/**
 * Designed to display timeseries data in a prometheus like table format.
 * The first column will contain the metric name and label combination, and the second column will contain the values.
 * This is inspired by prometheus DataTable.
 * https://github.com/prometheus/prometheus/blob/2524a915915d7eb1b1207152d2e0ce5771193404/web/ui/react-app/src/pages/graph/DataTable.tsx
 * @param result timeseries query result
 * @constructor
 */
const DataTable = ({ result }: DataTableProps) => {
  if (!result) {
    return null;
  }
  const series = result.flatMap((d) => d.data).flatMap((d) => d?.series || []);
  const rows = buildRows(series);

  return (
    <>
      <Table className="data-table">
        <tbody>{rows}</tbody>
      </Table>
    </>
  );
};

function buildRows(series: TimeSeries[]): ReactNode[] {
  return series.map((s, seriesIdx) => {
    const displayTimeStamps = (s.values?.length || 0) > 1;
    const valuesAndTimes = s.values
      ? s.values.map((v, valIdx) => {
          return (
            <Fragment key={valIdx}>
              {v[1]} {displayTimeStamps && <span>@{v[0]}</span>}
              <br />
            </Fragment>
          );
        })
      : [];
    const histogramsAndTimes = s.histograms
      ? s.histograms.map((h: any, hisIdx: number) => {
          return (
            <Fragment key={-hisIdx}>
              {histogramTable(h[1])} @<span>{h[0]}</span>
              <br />
            </Fragment>
          );
        })
      : [];
    return (
      <tr style={{ whiteSpace: 'pre' }} key={seriesIdx}>
        <td>{s.formattedName || s.name}</td>
        <td>
          {valuesAndTimes} {histogramsAndTimes}
        </td>
      </tr>
    );
  });
}

const leftDelim = (br: number): string => (br === 3 || br === 1 ? '[' : '(');
const rightDelim = (br: number): string => (br === 3 || br === 0 ? ']' : ')');

export const bucketRangeString = ([boundaryRule, leftBoundary, rightBoundary, _]: [
  number,
  string,
  string,
  string,
]): string => {
  return `${leftDelim(boundaryRule)}${leftBoundary} -> ${rightBoundary}${rightDelim(boundaryRule)}`;
};

export const histogramTable = (h: any): ReactNode => (
  <Table>
    <thead>
      <tr>
        <th style={{ textAlign: 'center' }} colSpan={2}>
          Histogram Sample
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th>Range</th>
        <th>Count</th>
      </tr>
      {h.buckets?.map((b: any, i: any) => (
        <tr key={i}>
          <td>{bucketRangeString(b)}</td>
          <td>{b[3]}</td>
        </tr>
      ))}
    </tbody>
  </Table>
);
export default DataTable;
