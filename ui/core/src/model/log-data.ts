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

import { Notice } from './notice';
import { AbsoluteTimeRange } from './time';
import { Labels } from './time-series-queries';

export interface LogEntry {
  timestamp: number;
  line: string;
  labels: Labels;
}

export interface LogData {
  timeRange?: AbsoluteTimeRange;
  entries: LogEntry[];
  metadata?: LogMetadata;
  totalCount: number;
  hasMore?: boolean;
  direction?: 'forward' | 'backward';
}

export interface LogStream {
  labels: Labels;
  entries: LogEntry[];
}

export interface LogMetadata {
  notices?: Notice[];

  /**
   * The raw query that is executed to generate this data.
   * Useful when needing to inspect the query that was executed
   * after variables and other context modifications have been applied.
   */
  executedQueryString?: string;

  /**
   * Statistics about the log query execution
   */
  stats?: LogQueryStats;
}

export interface LogQueryStats {
  /**
   * Number of bytes examined during the query
   */
  bytesExamined?: number;

  /**
   * Number of lines examined during the query
   */
  linesExamined?: number;

  /**
   * Query execution time in milliseconds
   */
  executionTimeMs?: number;

  /**
   * Number of streams processed
   */
  streamsProcessed?: number;
}
