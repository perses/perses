// Copyright 2021 The Perses Authors
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

import { URLBuilderUtil } from './url-builder';

describe('URLBuilderUtil', () => {
  let builder: URLBuilderUtil;

  beforeEach(() => {
    builder = new URLBuilderUtil();
  });

  it('if no params, should return no params in the uri', () => {
    const expectedURI = '/api/v1/test';
    builder.setResource('test');

    expect(builder.build()).toEqual(expectedURI);
  });

  it('check if set project is considered', () => {
    const expectedURI = '/api/v1/projects/perses/test';
    builder.setProject('perses').setResource('test');
    expect(builder.build()).toEqual(expectedURI);
  });

  it('complete test', () => {
    const expectedURI = '/api/v1/projects/perses/test/superName';
    builder.setResource('test').setProject('perses').setName('superName');
    expect(builder.build()).toEqual(expectedURI);
  });
});
