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

import { AnnotationEvent } from '@perses-dev/core';
import { createContext, useContext } from 'react';

export type AnnotationSrv = {
  annotations: AnnotationEvent[];
};

export const AnnotationContext = createContext<AnnotationSrv | undefined>(undefined);

export function useAnnotationContext() {
  const ctx = useContext(AnnotationContext);
  if (ctx === undefined) {
    throw new Error('No found AnnotationContext. Did you forget the AnnotationsProvider?');
  }
  return {
    annotations: ctx.annotations,
  };
}
