// Copyright 2022 The Perses Authors
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

export default {
  job: {
    value: 'node',
    loading: false,
    options: [
      {
        value: 'alertmanager',
        label: 'alertmanager',
      },
      {
        value: 'blackbox',
        label: 'blackbox',
      },
      {
        value: 'caddy',
        label: 'caddy',
      },
      {
        value: 'grafana',
        label: 'grafana',
      },
      {
        value: 'node',
        label: 'node',
      },
      {
        value: 'prometheus',
        label: 'prometheus',
      },
      {
        value: 'random',
        label: 'random',
      },
    ],
  },
  instance: {
    value: ['demo.do.prometheus.io:9100'],
    loading: false,
    options: [
      {
        value: 'demo.do.prometheus.io:9100',
        label: 'demo.do.prometheus.io:9100',
      },
    ],
  },
  interval: {
    value: '1m',
    loading: false,
    options: [
      {
        label: '1m',
        value: '1m',
      },
      {
        label: '5m',
        value: '5m',
      },
    ],
  },
};
