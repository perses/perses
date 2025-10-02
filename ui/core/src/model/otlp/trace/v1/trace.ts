// Copyright 2025 The Perses Authors
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

import { InstrumentationScope, KeyValue } from '../../common/v1/common';
import { Resource } from '../../resource/v1/resource';

// https://github.com/open-telemetry/opentelemetry-proto/blob/v1.5.0/opentelemetry/proto/trace/v1/trace.proto
// https://github.com/open-telemetry/opentelemetry-proto/blob/v1.5.0/examples/trace.json

export interface TracesData {
  resourceSpans: ResourceSpan[];
}

export interface ResourceSpan {
  resource?: Resource;
  scopeSpans: ScopeSpans[];
}

export interface ScopeSpans {
  scope?: InstrumentationScope;
  spans: Span[];
}

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind?: string;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes?: KeyValue[];
  events?: Event[];
  links?: Link[];
  status?: Status;
}

export interface Event {
  timeUnixNano: string;
  name: string;
  attributes?: KeyValue[];
}

export interface Link {
  traceId: string;
  spanId: string;
  attributes?: KeyValue[];
}

export interface Status {
  code?: typeof StatusCodeUnset | typeof StatusCodeOk | typeof StatusCodeError;
  message?: string;
}

export const StatusCodeUnset = 'STATUS_CODE_UNSET';
export const StatusCodeOk = 'STATUS_CODE_OK';
export const StatusCodeError = 'STATUS_CODE_ERROR';
