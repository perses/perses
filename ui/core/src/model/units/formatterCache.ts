// Copyright The Perses Authors
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

type FormatFn = (value: number | bigint) => string;
type InputType = 'time' | 'temperature' | 'bytes' | 'bits' | 'decimal' | 'currency' | 'percent' | 'throughput';
type Locals = 'en-US' | 'en-GB';

/**
 * REASONING FOR CLUSTERING (Map-of-Maps):
 *
 * 1. PERSISTENCE & REUSE: Intl.NumberFormat instantiation is CPU-heavy due to
 *    locale/data lookups. Clustering allows 100x faster reuse via caching.
 *
 *
 * 2. LOOKUP PERFORMANCE: Smaller, specialized Maps reduce the risk of hash
 *    collisions, ensuring O(1) retrieval time remains consistent even as
 *    the total number of formatters across the app grows.
 *
 * 3. GARBAGE COLLECTION & STATS: Categorization allows for targeted memory
 *    monitoring and easier debugging of which specific data types are
 *    consuming the most resources.
 */
const TIME_FORMATTER_CACHE = new Map<string, Intl.NumberFormat>();
const DECIMAL_FORMATTER_CACHE = new Map<string, Intl.NumberFormat>();
const BITS_FORMATTER_CACHE = new Map<string, Intl.NumberFormat>();
const BYTES_FORMATTER_CACHE = new Map<string, Intl.NumberFormat>();
const CURRENCY_FORMATTER_CACHE = new Map<string, Intl.NumberFormat>();
const PERCENT_FORMATTER_CACHE = new Map<string, Intl.NumberFormat>();
const TEMPERATURE_FORMATTER_CACHE = new Map<string, Intl.NumberFormat>();
const THROUGHPUT_FORMATTER_CACHE = new Map<string, Intl.NumberFormat>();

const ALL_FORMATTERS: Map<InputType, Map<string, Intl.NumberFormat>> = new Map([
  ['time', TIME_FORMATTER_CACHE],
  ['decimal', DECIMAL_FORMATTER_CACHE],
  ['bits', BITS_FORMATTER_CACHE],
  ['bytes', BYTES_FORMATTER_CACHE],
  ['currency', CURRENCY_FORMATTER_CACHE],
  ['percent', PERCENT_FORMATTER_CACHE],
  ['temperature', TEMPERATURE_FORMATTER_CACHE],
  ['throughput', THROUGHPUT_FORMATTER_CACHE],
]);

export function getFormatterFromCache(
  key: Array<string | number | boolean | undefined>,
  inputType: InputType,
  formatterOptions: Intl.NumberFormatOptions,
  locals: Locals = 'en-US'
): FormatFn {
  const compoundKey = `${key.filter((k) => !([undefined, null, '', NaN] as unknown[]).includes(k)).join('|')}|${locals}`;
  const inputTypeFormatters = ALL_FORMATTERS.get(inputType);
  if (!inputTypeFormatters) throw new Error('No formatter found for the input type');

  const formatter = inputTypeFormatters.get(compoundKey);
  if (formatter) {
    return formatter.format;
  }

  const newFormatter = Intl.NumberFormat(locals, formatterOptions);
  inputTypeFormatters?.set(`${compoundKey}`, newFormatter);

  return newFormatter.format;
}

/* This is a small utility for unit tests */
export interface IFormatterStats {
  countCacheItems: (inputType: InputType | 'all') => number;
  getKeys: (inputType: InputType) => string[];
}

export const getFormatterStats = (): IFormatterStats => {
  const countCacheItems = (inputType: InputType | 'all'): number => {
    if (inputType !== 'all') {
      return ALL_FORMATTERS.get(inputType)?.size ?? 0;
    }

    return Array.from(ALL_FORMATTERS.values()).reduce((acc, map) => acc + (map?.size ?? 0), 0);
  };

  const getKeys = (inputType: InputType): string[] => {
    return [...(ALL_FORMATTERS.get(inputType)?.keys() || [])];
  };

  return { countCacheItems, getKeys };
};
