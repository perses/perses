// Copyright 2023 The Perses Authors
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

import { Definition } from './definitions';
import { Display } from './display';

export type AnnotationEvent = {
  timestamp: number;
  endTimestamp?: number;
  color?: string;
  title?: string;
};

export interface AnnotationSpec {
  name: string;
  display?: Display & {
    hidden?: boolean;
  };
}

export interface StaticAnnotationDefinition extends Definition<StaticAnnotationSpec> {
  kind: 'StaticAnnotation';
}
export interface StaticAnnotationSpec extends AnnotationSpec {
  annotations: AnnotationEvent[];
}

// export interface QueryAnnotationDefinition<PluginSpec = UnknownSpec>
//   extends Definition<QueryAnnotationSpec<PluginSpec>> {
//   kind: 'QueryAnnotation';
// }

// export interface QueryAnnotationSpec<PluginSpec> extends AnnotationSpec {
//   plugin: Definition<PluginSpec>;
// }

export type AnnotationDefinition = StaticAnnotationDefinition;

export interface AnnotationsProviderProps {
  children: React.ReactNode;
  initialAnnotationDefinitions?: AnnotationDefinition[];
}
