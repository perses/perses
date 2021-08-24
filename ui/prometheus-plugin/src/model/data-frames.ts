import { DataFrame, Series } from '@perses-ui/core';
import { InstantQueryResponse, RangeQueryResponse } from './api-types';
import { parseValueTuple } from './parse-sample-values';

export function createDataFrames(
  response?: InstantQueryResponse | RangeQueryResponse
): DataFrame[] {
  const data = response?.data;
  if (data === undefined) return [];

  // Scalar results just have one value
  if (data.resultType === 'scalar') {
    const timeColumn = createTimeColumn();
    const valueColumn = createValueColumn();

    const [unixTimeMs, sampleValue] = parseValueTuple(data.result);
    timeColumn.values.push(unixTimeMs);
    valueColumn.values.push(sampleValue);

    // TODO: Name data frames?
    const dataFrame = createDataFrame('', timeColumn, valueColumn);
    return [dataFrame];
  }

  // For vector/matrix data, create one DataFrame for each metric series
  const dataFrames: DataFrame[] = [];
  for (const series of data.result) {
    const timeColumn = createTimeColumn();
    const valueColumn = createValueColumn();

    // Vector data will only have on value tuple, so just wrap it in an array
    const values = 'value' in series ? [series.value] : series.values;
    for (const valueTuple of values) {
      const [unixTimeMs, sampleValue] = parseValueTuple(valueTuple);
      timeColumn.values.push(unixTimeMs);
      valueColumn.values.push(sampleValue);
    }

    // TODO: Name data frames?
    dataFrames.push(createDataFrame('', timeColumn, valueColumn));
  }

  return dataFrames;
}

function createTimeColumn(): Series<'Date'> {
  return { seriesType: 'Date', name: 'Timestamp', values: [] };
}

function createValueColumn(): Series<'Number'> {
  return { seriesType: 'Number', name: 'Value', values: [] };
}

function createDataFrame(
  name: string,
  timeColumn: Series<'Date'>,
  valueColumn: Series<'Number'>
): DataFrame {
  return { name, columns: [timeColumn, valueColumn] };
}
