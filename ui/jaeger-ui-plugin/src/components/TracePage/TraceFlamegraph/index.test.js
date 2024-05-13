// Copyright (c) 2022 The Jaeger Authors.
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

import React from 'react';
import { shallow } from 'enzyme';
import { convertJaegerTraceToProfile } from '@pyroscope/flamegraph';

import TraceFlamegraph from './index';

import testTrace from './testTrace.json';

const profile = convertJaegerTraceToProfile(testTrace.data);

describe('convertJaegerTraceToProfile', () => {
  it('returns correct profile format', () => {
    expect(profile.version).toBe(1);

    expect(Array.isArray(profile.flamebearer.levels)).toBe(true);
    expect(profile.flamebearer.levels[0].every(el => typeof el === 'number')).toBe(true);
    expect(Array.isArray(profile.flamebearer.names)).toBe(true);
    expect(profile.flamebearer.names.every(el => typeof el === 'string')).toBe(true);
    expect(typeof profile.flamebearer.numTicks).toBe('number');

    expect(typeof profile.metadata.format).toBe('string');
    expect(typeof profile.metadata.sampleRate).toBe('number');
    expect(typeof profile.metadata.spyName).toBe('string');
    expect(typeof profile.metadata.units).toBe('string');
  });
});

describe('<TraceFlamegraph />', () => {
  let wrapper;

  beforeEach(() => {
    const props = { trace: testTrace };
    wrapper = shallow(<TraceFlamegraph {...props} />);
  });

  it('renders as expected', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('does not explode', () => {
    expect(wrapper).toBeDefined();
    expect(wrapper.find('.Flamegraph-wrapper').length).toBe(1);
  });

  it('renders profile table and flamegraph', () => {
    expect(wrapper).toBeDefined();
    expect(wrapper.html().includes('flamegraph-table')).toBe(true);
    expect(wrapper.html().includes('flamegraph-view')).toBe(true);
  });

  it('may show no profile', () => {
    const props = {};
    wrapper = shallow(<TraceFlamegraph {...props} />);
    expect(wrapper).toBeDefined();
    expect(wrapper.html().includes('no-profiling-data')).toBe(true);
  });
});
