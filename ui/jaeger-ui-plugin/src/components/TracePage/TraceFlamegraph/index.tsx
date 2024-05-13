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
import { FlamegraphRenderer, convertJaegerTraceToProfile } from '@pyroscope/flamegraph';

import '@pyroscope/flamegraph/dist/index.css';
import './index.css';

const TraceFlamegraph = ({ trace }: any) => {
  const convertedProfile = trace && trace.data ? convertJaegerTraceToProfile(trace.data) : null;

  return (
    <div className="Flamegraph-wrapper">
      <FlamegraphRenderer colorMode="light" profile={convertedProfile} />
    </div>
  );
};

export default TraceFlamegraph;
