// Copyright 2024 The Perses Authors
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

import { EditorState } from '@uiw/react-codemirror';
import { parser } from '@grafana/lezer-traceql';
import { LRLanguage, ensureSyntaxTree } from '@codemirror/language';
import { Completions, identifyCompletions } from './complete';

const traceQLExtension = LRLanguage.define({ parser: parser });

describe('complete', () => {
  const tests: Array<{ expr: string; pos?: number; expected: Completions | undefined }> = [
    // start
    {
      expr: '',
      expected: undefined,
    },
    {
      expr: '{ ',
      expected: {
        scopes: [{ kind: 'Scopes' }, { kind: 'TagName', scope: 'intrinsic' }],
        from: 2,
      },
    },
    {
      expr: '{}',
      pos: 1,
      expected: {
        scopes: [{ kind: 'Scopes' }, { kind: 'TagName', scope: 'intrinsic' }],
        from: 1,
      },
    },
    {
      expr: '{}',
      expected: undefined,
    },
    {
      expr: '{ status=ok ',
      expected: undefined,
    },
    {
      expr: '{ status=ok }',
      pos: -1,
      expected: undefined,
    },
    {
      expr: '{ status=ok && ',
      expected: {
        scopes: [{ kind: 'Scopes' }, { kind: 'TagName', scope: 'intrinsic' }],
        from: 15,
      },
    },
    {
      expr: '{ status=ok && }',
      pos: -1,
      expected: {
        scopes: [{ kind: 'Scopes' }, { kind: 'TagName', scope: 'intrinsic' }],
        from: 15,
      },
    },

    // tag names
    {
      expr: '{ resource.',
      expected: { scopes: [{ kind: 'TagName', scope: 'resource' }], from: 11 },
    },
    {
      expr: '{ span.',
      expected: { scopes: [{ kind: 'TagName', scope: 'span' }], from: 7 },
    },
    {
      expr: '{ .', // unscoped attributes
      expected: {
        scopes: [
          { kind: 'TagName', scope: 'resource' },
          { kind: 'TagName', scope: 'span' },
        ],
        from: 3,
      },
    },
    {
      expr: '{ resource.s',
      expected: { scopes: [{ kind: 'TagName', scope: 'resource' }], from: 11 },
    },
    {
      expr: '{ span.s',
      expected: { scopes: [{ kind: 'TagName', scope: 'span' }], from: 7 },
    },
    {
      expr: '{ .s',
      expected: {
        scopes: [
          { kind: 'TagName', scope: 'resource' },
          { kind: 'TagName', scope: 'span' },
        ],
        from: 3,
      },
    },

    // intrinsic fields
    {
      expr: '{ s',
      expected: { scopes: [{ kind: 'Scopes' }, { kind: 'TagName', scope: 'intrinsic' }], from: 2 },
    },
    {
      expr: '{ span:s',
      expected: { scopes: [{ kind: 'TagName', scope: 'intrinsic' }], from: 2 },
    },
    {
      expr: '{ status=ok && s',
      expected: { scopes: [{ kind: 'Scopes' }, { kind: 'TagName', scope: 'intrinsic' }], from: 15 },
    },

    // tag values
    {
      expr: '{ name=',
      expected: { scopes: [{ kind: 'TagValue', tag: 'name' }], from: 7 },
    },
    {
      expr: '{ name=H',
      expected: { scopes: [{ kind: 'TagValue', tag: 'name' }], from: 7 },
    },
    {
      expr: '{ name="',
      expected: { scopes: [{ kind: 'TagValue', tag: 'name' }], from: 8 },
    },
    {
      expr: '{ name=""',
      pos: -1,
      expected: { scopes: [{ kind: 'TagValue', tag: 'name' }], from: 8 },
    },
    {
      expr: '{ name=""',
      expected: undefined,
    },
    {
      expr: '{ name="H',
      expected: { scopes: [{ kind: 'TagValue', tag: 'name' }], from: 8 },
    },
    {
      expr: '{ name="H"',
      pos: -1,
      expected: { scopes: [{ kind: 'TagValue', tag: 'name' }], from: 8 },
    },
    {
      expr: '{ name="H"',
      expected: undefined,
    },
    {
      expr: '{ resource.service.name=',
      expected: { scopes: [{ kind: 'TagValue', tag: 'resource.service.name' }], from: 24 },
    },
    {
      expr: '{ resource.service.name=""',
      pos: -1,
      expected: { scopes: [{ kind: 'TagValue', tag: 'resource.service.name' }], from: 25 },
    },
    {
      expr: '{ span.http.method=""',
      pos: -1,
      expected: { scopes: [{ kind: 'TagValue', tag: 'span.http.method' }], from: 20 },
    },
    {
      expr: '{ .service.name=""',
      pos: -1,
      expected: { scopes: [{ kind: 'TagValue', tag: '.service.name' }], from: 17 },
    },
    {
      expr: '{ .service.name="article-" && status=error }',
      pos: 25,
      expected: { scopes: [{ kind: 'TagValue', tag: '.service.name' }], from: 17 },
    },
    {
      expr: '{ status=',
      expected: { scopes: [{ kind: 'TagValue', tag: 'status' }], from: 9 },
    },
    {
      expr: '{ status=e',
      expected: { scopes: [{ kind: 'TagValue', tag: 'status' }], from: 9 },
    },
  ];

  it.each(tests)('retrieve completions for $expr', ({ expr, pos, expected }) => {
    if (pos === undefined) pos = expr.length;
    if (pos < 0) pos = expr.length + pos;

    const state = EditorState.create({ doc: expr, extensions: traceQLExtension });
    const tree = ensureSyntaxTree(state, expr.length, 1000);
    expect(tree).not.toBeNull();
    const completions = identifyCompletions(state, pos, tree!);
    expect(completions).toEqual(expected);
  });
});
