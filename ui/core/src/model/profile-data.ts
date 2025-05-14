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

/**
 * A stackTrace
 * Every function has his stackTrace.
 * Children of a function are functions called by the parent function during its execution.
 */
export interface StackTrace {
  id: number; // index of function's name in names array
  name: string; // function's name
  level: number; // level of the function in the flame graph
  start: number; // time at which the function starts
  end: number; // time at which the function ends
  total: number; // total samples (including the samples in its children nodes)
  self: number; // self samples (excluding the samples in its children nodes)
  children: StackTrace[];
}

/**
 * Timeline attribute contains data to draw the chart showing the evolution of the profiled resource over time (CPU, memory, etc.).
 * It is like a metric and it helps to identify bottlenecks.
 */
export interface Timeline {
  startTime: number; // Time at which the timeline starts, as a Unix timestamp
  samples: number[]; // A sequence of samples starting at startTime, spaced by durationDelta seconds
  durationDelta: number; // Time delta between samples, in seconds
}

/**
 * An entire profile
 * It is the stacktrace of the root function.
 */
export interface Profile {
  stackTrace: StackTrace;
}

/**
 * A generalized data-model that will be used by Panel components
 * to display profiles.
 */
export interface ProfileData {
  profile: Profile;
  timeline?: Timeline;

  numTicks?: number; // Total number of samples
  maxSelf?: number; // Maximum self value in any node

  metadata?: ProfileMetaData;
}

export interface ProfileMetaData {
  spyName: string; // Name of the spy / profiler used to generate the profile, if any
  sampleRate: number; // Sample rate at which the profiler was operating
  units: string; // The unit of measurement for the profiled data
  name: string; // A name that identifies the profile. [Is this really necessary?]
}
