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

import { TimeSeriesData, TimeSeries } from '@perses-dev/core';

// Function to check if the data is time series data
export const isTimeSeriesData = (data: TimeSeriesData | undefined): boolean => {
  return !!(data && data.series && Array.isArray(data.series) && data.series.length > 0);
};

// Function to format labels similar to how Perses displays them in legends
export const formatLegendName = (series: TimeSeries, seriesIndex: number): string => {
  const seriesAny = series as TimeSeries & {
    formattedName?: string;
    legendName?: string;
    displayName?: string;
    legend?: string;
    labels?: Record<string, string>;
  };

  // First try the standard TimeSeries properties that Perses uses for legend display
  let legendName = series.formattedName || series.name;

  // If we still don't have a good name, try other potential properties
  if (!legendName || legendName === `Series ${seriesIndex + 1}`) {
    legendName = seriesAny.legendName || seriesAny.displayName || seriesAny.legend || series.name || '';
  }

  // If we have labels, construct a meaningful name using Perses-style formatting
  if ((!legendName || legendName === series.name) && series.labels) {
    const labels = series.labels;

    // Remove __name__ from labels for cleaner display (common Prometheus practice)
    const displayLabels = { ...labels };
    const metricName = displayLabels.__name__;
    delete displayLabels.__name__;

    // Create label pairs in the format key="value"
    const labelPairs = Object.entries(displayLabels)
      .filter(([value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${key}="${value}"`)
      .join(', ');

    if (metricName && labelPairs) {
      legendName = `${metricName}{${labelPairs}}`;
    } else if (metricName) {
      legendName = metricName;
    } else if (labelPairs) {
      legendName = `{${labelPairs}}`;
    } else {
      // Fallback to trying common labels
      legendName = labels.job || labels.instance || labels.metric || `Series ${seriesIndex + 1}`;
    }
  }

  // Final fallback
  if (!legendName || legendName.trim() === '') {
    legendName = `Series ${seriesIndex + 1}`;
  }

  return legendName;
};

// Function to sanitize column names for CSV (Excel/Sheets compatible)
export const sanitizeColumnName = (name: string): string => {
  return name
    .replace(/[,"\n\r]/g, '_') // Replace CSV-problematic characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .substring(0, 255); // Limit length for Excel compatibility
};

// Function to sanitize filename
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[<>:"/\\|?*]/g, ' ') // Replace invalid filename characters with spaces first
    .trim() // Remove leading/trailing whitespace
    .split(/\s+/) // Split on any whitespace
    .filter((word) => word.length > 0) // Remove empty strings
    .map((word, index) => {
      // First word stays lowercase, subsequent words get capitalized
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(''); // Join without separators to create camelCase
};

// Function to format timestamp in ISO 8601 format (Excel/Sheets compatible)
export const formatTimestampISO = (timestamp: number | string): string => {
  let timestampMs: number;

  // Handle different timestamp formats
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return timestamp; // Return original if can't parse
    }
    timestampMs = date.getTime();
  } else {
    // Convert Unix timestamp to milliseconds if needed
    timestampMs = timestamp > 1e10 ? timestamp : timestamp * 1000;
  }

  const date = new Date(timestampMs);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return new Date(timestampMs).toISOString();
  }

  // Return ISO 8601 format which includes timezone information
  return date.toISOString();
};

export const escapeCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

export interface ExportTimeSeriesOptions {
  queryResults: TimeSeriesData;
  title: string;
  projectName?: string;
}

export const exportTimeSeriesAsCSV = ({ queryResults, title, projectName }: ExportTimeSeriesOptions): void => {
  if (
    !queryResults ||
    !queryResults.series ||
    !Array.isArray(queryResults.series) ||
    queryResults.series.length === 0
  ) {
    alert('No valid data found to export to CSV.');
    return;
  }

  let csvString = '';
  const result: Record<string, Record<string, unknown>> = {};
  const seriesInfo: Array<{ legendName: string; columnName: string; originalName: string }> = [];
  let validSeriesCount = 0;

  // Process each series and collect legend information
  for (let i = 0; i < queryResults.series.length; i++) {
    const series = queryResults.series[i];

    if (!series) {
      continue;
    }

    if (!Array.isArray(series.values) || series.values.length === 0) {
      continue;
    }

    const legendName = formatLegendName(series, i);
    const columnName = sanitizeColumnName(legendName);

    const currentSeriesInfo = {
      legendName,
      columnName: columnName || `Series_${i + 1}`,
      originalName: series.name || '',
    };

    seriesInfo.push(currentSeriesInfo);
    validSeriesCount++;

    // Process the time series data for this series
    for (let j = 0; j < series.values.length; j++) {
      const entry = series.values[j];

      if (!Array.isArray(entry) || entry.length < 2) {
        continue;
      }

      const timestamp = entry[0];
      const value = entry[1];

      // Skip null or undefined values but allow 0
      if (value === null || value === undefined) {
        continue;
      }

      // Format timestamp in ISO 8601 format
      const dateTime = formatTimestampISO(timestamp);

      if (!result[dateTime]) {
        result[dateTime] = {};
      }

      result[dateTime]![currentSeriesInfo.columnName] = value;
    }
  }

  // Check if we actually have data to export
  if (validSeriesCount === 0 || seriesInfo.length === 0) {
    alert('No valid data found to export to CSV.');
    return;
  }

  const timestampCount = Object.keys(result).length;
  if (timestampCount === 0) {
    alert('No valid timestamp data found to export to CSV.');
    return;
  }

  // Build CSV content - SIMPLIFIED FORMAT
  // Add column headers only
  const columnNames = seriesInfo.map((info) => info.columnName);
  csvString += `DateTime,${columnNames.join(',')}\n`;

  // Add data rows - sort by timestamp
  const sortedDateTimes = Object.keys(result).sort((a, b) => {
    const dateA = new Date(a).getTime();
    const dateB = new Date(b).getTime();
    return dateA - dateB;
  });

  for (const dateTime of sortedDateTimes) {
    const rowData = result[dateTime];
    const values: string[] = [];

    if (rowData) {
      for (const columnName of columnNames) {
        const value = rowData[columnName];
        values.push(escapeCsvValue(value));
      }

      csvString += `${escapeCsvValue(dateTime)},${values.join(',')}\n`;
    }
  }

  // Create filename (keeping project name and title as requested)
  let filename = '';
  if (projectName) {
    filename = `${sanitizeFilename(projectName)}_${sanitizeFilename(title)}_data.csv`;
  } else {
    filename = `${sanitizeFilename(title)}_data.csv`;
  }

  // Create and download the file
  const blobCsvData = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
  const csvURL = URL.createObjectURL(blobCsvData);
  const link = document.createElement('a');
  link.href = csvURL;
  link.download = filename;

  // Ensure the link is added to the document for some browsers
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(csvURL);
};
