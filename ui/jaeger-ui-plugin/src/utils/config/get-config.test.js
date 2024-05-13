// Copyright (c) 2017 Uber Technologies, Inc.
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

/* eslint-disable no-console, import/first */

jest.mock('./process-deprecation');

import getConfig, { getConfigValue } from './get-config';
import processDeprecation from './process-deprecation';
import defaultConfig, { deprecations, mergeFields } from '../../constants/default-config';

describe('getConfig()', () => {
  const warnFn = jest.fn();
  let oldWarn;

  beforeAll(() => {
    oldWarn = console.warn;
    console.warn = warnFn;
  });

  beforeEach(() => {
    warnFn.mockClear();
  });

  afterAll(() => {
    console.warn = oldWarn;
  });

  describe('index functions are not yet injected by backend', () => {
    beforeAll(() => {
      window.getJaegerUiConfig = undefined;
      window.getJaegerStorageCapabilities = undefined;
    });

    it('warns once', () => {
      getConfig();
      expect(warnFn.mock.calls.length).toBe(1);
      getConfig();
      expect(warnFn.mock.calls.length).toBe(1);
    });

    it('returns the default config', () => {
      expect(getConfig()).toEqual(defaultConfig);
    });
  });

  describe('index functions are injected by backend', () => {
    let embedded;
    let capabilities;

    beforeEach(() => {
      getConfig.apply({}, []);
      embedded = {};
      window.getJaegerUiConfig = jest.fn(() => embedded);
      capabilities = defaultConfig.storageCapabilities;
      window.getJaegerStorageCapabilities = jest.fn(() => capabilities);
    });

    it('returns the default config when the embedded config is `null`', () => {
      embedded = null;
      expect(getConfig()).toEqual(defaultConfig);
    });

    it('merges the defaultConfig with the embedded config and storage capabilities', () => {
      embedded = { novel: 'prop' };
      capabilities = { archiveStorage: true };
      expect(getConfig()).toEqual({ ...defaultConfig, ...embedded, storageCapabilities: capabilities });
    });

    describe('overwriting precedence and merging', () => {
      describe('fields not in mergeFields', () => {
        it('gives precedence to the embedded config', () => {
          const mergeFieldsSet = new Set(mergeFields);
          const keys = Object.keys(defaultConfig).filter(k => !mergeFieldsSet.has(k));
          embedded = {};
          keys.forEach(key => {
            embedded[key] = key;
          });
          expect(getConfig()).toEqual({ ...defaultConfig, ...embedded, storageCapabilities: capabilities });
        });
      });

      describe('fields in mergeFields', () => {
        it('gives precedence to non-objects in embedded', () => {
          embedded = {};
          mergeFields.forEach((k, i) => {
            embedded[k] = i ? true : null;
          });
          expect(getConfig()).toEqual({ ...defaultConfig, ...embedded, storageCapabilities: capabilities });
        });

        it('merges object values', () => {
          embedded = {};
          const key = mergeFields[0];
          if (!key) {
            throw new Error('invalid mergeFields');
          }
          embedded[key] = { a: true, b: false };
          const expected = { ...defaultConfig, ...embedded };
          expected[key] = { ...defaultConfig[key], ...embedded[key] };
          expect(getConfig()).toEqual({ ...expected, storageCapabilities: capabilities });
        });
      });
    });

    it('processes deprecations in `getConfig` is invoked only once', () => {
      processDeprecation.mockClear();
      getConfig();
      expect(processDeprecation.mock.calls.length).toBe(deprecations.length);
      getConfig();
      expect(processDeprecation.mock.calls.length).toBe(deprecations.length);
    });
  });
});

describe('getConfigValue(...)', () => {
  it('returns embedded paths, e.g. "a.b"', () => {
    expect(getConfigValue('dependencies.menuEnabled')).toBe(true);
  });

  it('handles non-existent paths"', () => {
    expect(getConfigValue('not.a.real.path')).toBe(undefined);
  });
});
