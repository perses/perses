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

import { Completion, CompletionContext, CompletionResult, insertCompletionText } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { Tree } from '@lezer/common';
import {
  String as StringType,
  FieldExpression,
  AttributeField,
  Resource,
  Identifier,
  Span,
  SpansetFilter,
  FieldOp,
} from '@grafana/lezer-traceql';
import { EditorView } from '@uiw/react-codemirror';
import { TempoClient } from '../model/tempo-client';

/** CompletionScope specifies the completion kind, e.g. whether to complete tag names or values etc. */
type CompletionScope =
  | { kind: 'Scopes' } // 'resource'|'span'
  | { kind: 'TagName'; scope: 'resource' | 'span' | 'intrinsic' }
  | { kind: 'TagValue'; tag: string };

/**
 * Completions specifies the identified scopes and position of the completion in the current editor text.
 * For example, when entering '{' the following completions are possible: Scopes(), TagName(scope=intrinsic)
 */
export interface Completions {
  scopes: CompletionScope[];
  from: number;
  to?: number;
}

export async function complete(
  { state, pos }: CompletionContext,
  client?: TempoClient
): Promise<CompletionResult | null> {
  // First, identify the completion scopes, for example Scopes() and TagName(scope=intrinsic)
  const completions = identifyCompletions(state, pos, syntaxTree(state));
  if (!completions) {
    // No completion scopes found for current cursor position.
    return null;
  }

  // Then, retrieve completion options for all identified scopes (from the Tempo API).
  const options = await retrieveOptions(completions.scopes, client);
  return { options, from: completions.from, to: completions.to };
}

/**
 * Identify completion scopes (e.g. TagValue) and position, based on the current node in the syntax tree.
 *
 * For development, you can visualize the tree of a TraceQL query using this tool:
 * https://github.com/grafana/lezer-traceql/blob/main/tools/tree-viz.html
 *
 * Function is exported for tests only.
 */
export function identifyCompletions(state: EditorState, pos: number, tree: Tree): Completions | undefined {
  const node = tree.resolveInner(pos, -1);

  switch (node.type.id) {
    case SpansetFilter:
      // autocomplete {
      // autocomplete {}
      // do not autocomplete if cursor is after } or { status=ok }
      if (
        (node.firstChild === null || node.firstChild?.type.id === 0) &&
        !state.sliceDoc(node.from, pos).includes('}')
      ) {
        return {
          scopes: [{ kind: 'Scopes' }, { kind: 'TagName', scope: 'intrinsic' }],
          from: pos,
        };
      }
      break;

    case FieldExpression:
      // autocomplete { status=ok &&
      return {
        scopes: [{ kind: 'Scopes' }, { kind: 'TagName', scope: 'intrinsic' }],
        from: pos,
      };

    case AttributeField:
      // autocomplete { resource.
      if (node.firstChild?.type.id === Resource) {
        return { scopes: [{ kind: 'TagName', scope: 'resource' }], from: pos };
      }

      // autocomplete { span.
      if (node.firstChild?.type.id === Span) {
        return { scopes: [{ kind: 'TagName', scope: 'span' }], from: pos };
      }

      // autocomplete { .
      if (state.sliceDoc(node.from, node.to) === '.') {
        return {
          scopes: [
            { kind: 'TagName', scope: 'resource' },
            { kind: 'TagName', scope: 'span' },
          ],
          from: pos,
        };
      }
      break;

    case Identifier:
      if (node.parent?.type.id === AttributeField) {
        const text = state.sliceDoc(node.parent.from, node.parent.to);
        // autocomplete { span:s
        // only intrinsic fields can have a : in the name.
        if (text.includes(':')) {
          return { scopes: [{ kind: 'TagName', scope: 'intrinsic' }], from: node.parent.from };
        }

        // autocomplete { resource.s
        if (node.parent?.firstChild?.type.id === Resource) {
          return { scopes: [{ kind: 'TagName', scope: 'resource' }], from: node.from };
        }

        // autocomplete { span.s
        if (node.parent?.firstChild?.type.id === Span) {
          return { scopes: [{ kind: 'TagName', scope: 'span' }], from: node.from };
        }

        // autocomplete { .s
        if (node.parent?.firstChild?.type.id === Identifier) {
          return {
            scopes: [
              { kind: 'TagName', scope: 'resource' },
              { kind: 'TagName', scope: 'span' },
            ],
            from: node.from,
          };
        }
      }
      break;

    case FieldOp:
      // autocomplete { status=
      // autocomplete { span.http.method=
      if (node.parent?.firstChild?.type.id === FieldExpression) {
        const fieldExpr = node.parent.firstChild;
        const attribute = state.sliceDoc(fieldExpr.from, fieldExpr.to);
        return { scopes: [{ kind: 'TagValue', tag: attribute }], from: pos };
      }
      break;

    case StringType:
      // autocomplete { resource.service.name="
      // do not autocomplete if cursor is after closing quotes { resource.service.name=""
      if (
        node.parent?.parent?.parent?.firstChild?.type.id === FieldExpression &&
        !/^".*"$/.test(state.sliceDoc(node.from, pos))
      ) {
        const fieldExpr = node.parent.parent.parent.firstChild;
        const attribute = state.sliceDoc(fieldExpr.from, fieldExpr.to);
        return { scopes: [{ kind: 'TagValue', tag: attribute }], from: node.from + 1 }; // node.from+1 to ignore leading "
      }
      break;

    case 0 /* error node */:
      // autocomplete { status=e
      if (node.prevSibling?.type.id === FieldOp && node.parent?.firstChild?.type.id === FieldExpression) {
        const fieldExpr = node.parent.firstChild;
        const attribute = state.sliceDoc(fieldExpr.from, fieldExpr.to);
        // ignore leading " in { name="HT
        const from = state.sliceDoc(node.from, node.from + 1) === '"' ? node.from + 1 : node.from;
        return { scopes: [{ kind: 'TagValue', tag: attribute }], from };
      }

      // autocomplete { s
      // autocomplete { status=ok && s
      if (node.parent?.type.id === SpansetFilter || node.parent?.type.id === FieldExpression) {
        return {
          scopes: [{ kind: 'Scopes' }, { kind: 'TagName', scope: 'intrinsic' }],
          from: node.from,
        };
      }
      break;
  }
}

/**
 * Retrieve all completion options based on the previously identified completion scopes.
 */
async function retrieveOptions(completions: CompletionScope[], client?: TempoClient): Promise<Completion[]> {
  const results: Array<Promise<Completion[]>> = [];

  for (const completion of completions) {
    switch (completion.kind) {
      case 'Scopes':
        results.push(Promise.resolve([{ label: 'span' }, { label: 'resource' }]));
        break;

      case 'TagName':
        if (client) {
          results.push(completeTagName(client, completion.scope));
        }
        break;

      case 'TagValue':
        if (client) {
          results.push(completeTagValue(client, completion.tag));
        }
        break;
    }
  }

  // Retrieve options concurrently
  // e.g. for unscoped attribute fields, retrieve list of span and resource attributes concurrently.
  const options = await Promise.all(results);
  return options.flat();
}

async function completeTagName(client: TempoClient, scope: 'resource' | 'span' | 'intrinsic'): Promise<Completion[]> {
  const response = await client.searchTags({ scope });
  return response.scopes.flatMap((scope) => scope.tags).map((tag) => ({ label: tag }));
}

/**
 * Add quotes to the completion text in case quotes are not present already.
 * This handles the following cases:
 * { name=HTTP
 * { name="x
 * { name="x" where cursor is after the 'x'
 */
function applyQuotedCompletion(view: EditorView, completion: Completion, from: number, to: number): void {
  let insertText = completion.label;
  if (view.state.sliceDoc(from - 1, from) !== '"') {
    insertText = '"' + insertText;
  }
  if (view.state.sliceDoc(to, to + 1) !== '"') {
    insertText = insertText + '"';
  }
  view.dispatch(insertCompletionText(view.state, insertText, from, to));
}

async function completeTagValue(client: TempoClient, tag: string): Promise<Completion[]> {
  const response = await client.searchTagValues({ tag });
  const completions: Completion[] = [];
  for (const { type, value } of response.tagValues) {
    switch (type) {
      case 'string':
        completions.push({ label: value, apply: applyQuotedCompletion });
        break;

      case 'keyword':
      case 'int':
        completions.push({ label: value });
        break;
    }
  }
  return completions;
}
