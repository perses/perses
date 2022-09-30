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

/**
 * Helper function to generate a random color for a chart series based on its name
 */
export function getRandomColor(identifier: string): string {
  let hash = 0;
  for (let index = 0; index < identifier.length; index++) {
    hash = identifier.charCodeAt(index) + ((hash << 5) - hash);
  }
  // Use HSLA to only get random "bright" colors from this
  const color = `hsla(${~~(180 * hash)},50%,50%,0.8)`;
  return color;
}
