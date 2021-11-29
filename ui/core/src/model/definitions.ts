// Copyright 2021 The Perses Authors
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
 * Json config object.
 */
export interface JsonObject {
  [key: string]: Json | undefined;
}

/**
 * Json definition values.
 */
export type Json = string | number | boolean | null | JsonObject | Json[];

/**
 * Base type for definitions in JSON config resources.
 */
export interface Definition<Kind extends string, Options extends JsonObject> extends JsonObject {
  kind: Kind;
  options: Options;
}
