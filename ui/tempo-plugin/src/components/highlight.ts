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

import { styleTags, tags } from '@lezer/highlight';

export const traceQLHighlight = styleTags({
  LineComment: tags.comment,
  'Parent Resource Span Identifier': tags.labelName,
  IntrinsicField: tags.labelName,
  String: tags.string,
  'Integer Float Duration': tags.number,
  Static: tags.literal,
  'Aggregate AggregateExpression': tags.function(tags.keyword),
  'And Or': tags.logicOperator,
  'Gt Lt Desc Anc tilde ExperimentalOp': tags.bitwiseOperator, // structural operators
  ComparisonOp: tags.compareOperator,
  Pipe: tags.operator,
  ScalarOp: tags.arithmeticOperator,
  '( )': tags.paren,
  '[ ]': tags.squareBracket,
  '{ }': tags.brace,
  '⚠': tags.invalid,
});
