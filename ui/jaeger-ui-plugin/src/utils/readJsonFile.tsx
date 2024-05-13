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

import JaegerAPI from '../api/jaeger';

export default function readJsonFile(fileList: { file: File }): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Invalid result type'));
        return;
      }
      try {
        const traceObj = JSON.parse(reader.result);
        if ('resourceSpans' in traceObj) {
          JaegerAPI.transformOTLP(traceObj)
            .then((result: string) => {
              resolve(result);
            })
            .catch(() => {
              reject(new Error(`Error converting traces to OTLP`));
            });
        } else {
          resolve(traceObj);
        }
      } catch (error: unknown) {
        reject(new Error(`Error parsing JSON: ${(error as Error).message}`));
      }
    };
    reader.onerror = () => {
      const errMessage = reader.error ? `: ${String(reader.error)}` : '';
      reject(new Error(`Error reading the JSON file${errMessage}`));
    };
    reader.onabort = () => {
      reject(new Error(`Reading the JSON file has been aborted`));
    };
    try {
      reader.readAsText(fileList.file);
    } catch (error: unknown) {
      reject(new Error(`Error reading the JSON file: ${(error as Error).message}`));
    }
  });
}
