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

import parseQuery from './parseQuery';

describe('parseQuery', () => {
  it('should parse a query string with no options', () => {
    const queryString = 'foo=bar&baz=qux';
    const expected = { foo: 'bar', baz: 'qux' };
    expect(parseQuery(queryString)).toEqual(expected);
  });

  it('should parse a query string with options', () => {
    const queryString = 'foo[]=bar&foo[]';
    const options = { arrayFormat: 'bracket' };
    const expected = { foo: ['bar', ''] };
    expect(parseQuery(queryString, options)).toEqual(expected);
  });

  it('should handle null values in the query string', () => {
    const queryString = 'bar=&empty&baz';
    const expected = { bar: '', empty: null, baz: null };
    expect(parseQuery(queryString)).toEqual(expected);
  });

  it('should handle multiple values for the same key', () => {
    const queryString = 'colors=red&colors=blue&colors=green';
    const expected = { colors: ['red', 'blue', 'green'] };
    expect(parseQuery(queryString)).toEqual(expected);
  });

  it('should return an empty object for an empty query string', () => {
    const queryString = '';
    const expected = {};
    expect(parseQuery(queryString)).toEqual(expected);
  });
});
