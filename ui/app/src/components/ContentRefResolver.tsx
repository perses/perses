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

import {
  ContentRef,
  isLayoutRef,
  resolveLayoutRef,
  resolvePanelRef,
  useDashboardSpec,
} from '@perses-ui/core';
import ExpandLayout from './ExpandLayout';
import GridLayout from './GridLayout';
import Panel from './Panel';

export interface ContentRefResolverProps {
  contentRef: ContentRef;
}

/**
 * Resolves a ContentRef to a Layout or Panel definition and renders the
 * appropriate UI component for that definition.
 */
function ContentRefResolver(props: ContentRefResolverProps) {
  const spec = useDashboardSpec();

  if (isLayoutRef(props.contentRef)) {
    const definition = resolveLayoutRef(spec, props.contentRef);
    switch (definition.kind) {
      case 'expand':
        return <ExpandLayout definition={definition} />;
      case 'grid':
        return <GridLayout definition={definition} />;
      default:
        const exhaustive: never = definition;
        throw new Error(`Unhandled layout definition: ${exhaustive}`);
    }
  }

  const definition = resolvePanelRef(spec, props.contentRef);
  return <Panel definition={definition} />;
}

export default ContentRefResolver;
