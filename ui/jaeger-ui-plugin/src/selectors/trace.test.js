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

import { followsFromRef } from './trace.fixture';
import * as traceSelectors from './trace';
import traceGenerator from '../demo/trace-generators';

const generatedTrace = traceGenerator.trace({ numberOfSpans: 45 });

describe('getTraceSpanIdsAsTree()', () => {
  const getTraceSpansAsMap = trace =>
    trace.spans.reduce((map, span) => map.set(span.spanID, span), new Map());
  it('builds the tree properly', () => {
    const tree = traceSelectors.getTraceSpanIdsAsTree(generatedTrace);
    const spanMap = getTraceSpansAsMap(generatedTrace);

    tree.walk((value, node) => {
      const expectedParentValue = value === traceSelectors.TREE_ROOT_ID ? null : value;
      node.children.forEach(childNode => {
        const span = spanMap.get(childNode.value);
        const parentId = span.references.find(ref => ref.refType === 'CHILD_OF')?.spanID ?? null;
        expect(parentId).toBe(expectedParentValue);
      });
    });
  });

  it('#115 - handles FOLLOW_FROM refs', () => {
    expect(() => traceSelectors.getTraceSpanIdsAsTree(followsFromRef)).not.toThrow();
  });
});
