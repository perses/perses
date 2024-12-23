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

import { LRLanguage } from '@codemirror/language';
import { parser } from '@grafana/lezer-traceql';
import { CompletionContext } from '@codemirror/autocomplete';
import { Extension } from '@uiw/react-codemirror';
import { TempoClient } from '../model/tempo-client';
import { TempoDatasource } from '../plugins/tempo-datasource';
import { traceQLHighlight } from './highlight';
import { complete } from './complete';

function traceQLLanguage(): LRLanguage {
  return LRLanguage.define({
    parser: parser.configure({
      props: [traceQLHighlight],
    }),
    languageData: {
      closeBrackets: { brackets: ['(', '[', '{', "'", '"', '`'] },
      commentTokens: { line: '//' },
    },
  });
}

function getTempoClient(completionCfg: CompletionConfig): TempoClient | undefined {
  if (completionCfg.client) {
    return completionCfg.client;
  }
  if (completionCfg.endpoint) {
    return TempoDatasource.createClient({ directUrl: completionCfg.endpoint }, {});
  }
  return undefined;
}

export interface CompletionConfig {
  client?: TempoClient;
  endpoint?: string;
}

export function TraceQLExtension(completionCfg: CompletionConfig): Array<LRLanguage | Extension> {
  const tempoClient = getTempoClient(completionCfg);
  const language = traceQLLanguage();
  const completion = language.data.of({
    autocomplete: (ctx: CompletionContext) =>
      complete(ctx, tempoClient).catch((e) => console.error('error during TraceQL auto-complete', e)),
  });
  return [language, completion];
}
