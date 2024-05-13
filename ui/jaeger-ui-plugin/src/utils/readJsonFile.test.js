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

import fs from 'fs';
import lodash from 'lodash';
import readJsonFile from './readJsonFile';
import JaegerAPI from '../api/jaeger';

jest.spyOn(JaegerAPI, 'transformOTLP').mockImplementation(APICallRequest => {
  const OTLPTrace = JSON.parse(fs.readFileSync('src/utils/fixtures/otlp2jaeger-in.json', 'utf-8'));
  const jaegerTrace = JSON.parse(fs.readFileSync('src/utils/fixtures/otlp2jaeger-out.json', 'utf-8'));
  if (lodash.isEqual(APICallRequest, OTLPTrace)) {
    return Promise.resolve(jaegerTrace);
  }
  // This defines case where API call errors out even after detecting a `resourceSpan` in the request
  return Promise.reject();
});

describe('fileReader.readJsonFile', () => {
  it('rejects when given an invalid file', () => {
    const p = readJsonFile({ rando: true });
    return expect(p).rejects.toMatchObject(expect.any(Error));
  });

  it('does not throw when given an invalid file', () => {
    let threw = false;
    try {
      const p = readJsonFile({ rando: true });
      // prevent the unhandled rejection warning
      p.catch(() => {});
    } catch (_) {
      threw = true;
    }
    return expect(threw).toBe(false);
  });

  it('loads JSON data, successfully', () => {
    const obj = { ok: true };
    const file = new File([JSON.stringify(obj)], 'foo.json');
    const p = readJsonFile({ file });
    return expect(p).resolves.toMatchObject(obj);
  });

  it('loads JSON data (OTLP), successfully', () => {
    const inObj = JSON.parse(fs.readFileSync('src/utils/fixtures/otlp2jaeger-in.json', 'utf-8'));
    const outObj = JSON.parse(fs.readFileSync('src/utils/fixtures/otlp2jaeger-out.json', 'utf-8'));
    const file = new File([JSON.stringify(inObj)], 'foo.json');
    const p = readJsonFile({ file });
    return expect(p).resolves.toMatchObject(outObj);
  });

  it('rejects an OTLP trace', () => {
    const inObj = JSON.parse(fs.readFileSync('src/utils/fixtures/otlp2jaeger-in-error.json', 'utf-8'));
    const file = new File([JSON.stringify(inObj)], 'foo.json');
    const p = readJsonFile({ file });
    return expect(p).rejects.toMatchObject(expect.any(Error));
  });

  it('rejects on malform JSON', () => {
    const file = new File(['not-json'], 'foo.json');
    const p = readJsonFile({ file });
    return expect(p).rejects.toMatchObject(expect.any(Error));
  });
});
