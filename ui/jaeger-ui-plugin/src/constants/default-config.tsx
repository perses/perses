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

import deepFreeze from 'deep-freeze';

import { FALLBACK_DAG_MAX_NUM_SERVICES } from './index';

import { Config } from '../types/config';

const defaultConfig: Config = {
  archiveEnabled: true,
  criticalPathEnabled: true,
  dependencies: {
    dagMaxNumServices: FALLBACK_DAG_MAX_NUM_SERVICES,
    menuEnabled: true,
  },
  search: {
    maxLookback: {
      label: '2 Days',
      value: '2d',
    },
    maxLimit: 1500,
  },
  storageCapabilities: {
    archiveStorage: false,
  },
  tracking: {
    gaID: null,
    trackErrors: true,
  },
  linkPatterns: [],
  disableFileUploadControl: false,
  disableJsonView: false,
  forbidNewPage: false,
  traceGraph: {
    layoutManagerMemory: undefined,
  },

  deepDependencies: {
    menuEnabled: false,
  },
  qualityMetrics: {
    menuEnabled: false,
    menuLabel: 'Trace Quality',
  },
};

// Fields that should be merged with user-supplied config values rather than overwritten.
type TMergeField = 'dependencies' | 'search' | 'tracking';
export const mergeFields: readonly TMergeField[] = ['dependencies', 'search', 'tracking'];

export default deepFreeze(defaultConfig);

export const deprecations = [
  {
    formerKey: 'dependenciesMenuEnabled',
    currentKey: 'dependencies.menuEnabled',
  },
  {
    formerKey: 'gaTrackingID',
    currentKey: 'tracking.gaID',
  },
];
