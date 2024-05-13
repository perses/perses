// Copyright (c) 2019 Uber Technologies, Inc.
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

import queryString, { ParseOptions } from 'query-string';

interface IParsedQuery {
  [key: string]: string | null | (string | null)[];
}

function parseQuery(query: string, options?: ParseOptions): { [key: string]: string | string[] } {
  const parsed: IParsedQuery = queryString.parse(query, options);

  const result: { [key: string]: string | string[] } = {};

  Object.keys(parsed).forEach(key => {
    if (Array.isArray(parsed[key])) {
      result[key] = (parsed[key] as string[]).map((item: string | null) => item || '');
    } else {
      result[key] = parsed[key] as string | string[];
    }
  });

  return result;
}

export default parseQuery;
