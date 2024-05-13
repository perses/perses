// Copyright (c) 2021 The Jaeger Authors.
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

import { RavenStatic } from 'raven-js';
import { TNil } from '.';
import { Config } from './config';

export interface IWebAnalyticsFunc {
  (config: Config, versionShort: string, versionLong: string): IWebAnalytics;
}

export default interface IWebAnalytics {
  init: () => void;
  context: boolean | RavenStatic | null;
  isEnabled: () => boolean;
  trackPageView: (pathname: string, search: string | TNil) => void;
  trackError: (description: string) => void;
  trackEvent: (
    category: string,
    action: string,
    labelOrValue?: string | number | TNil,
    value?: number | TNil
  ) => void;
}
