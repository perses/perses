// Copyright 2021 Amadeus s.a.s
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

import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { PromQLExtension } from 'codemirror-promql';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from '@codemirror/basic-setup';
import { HighlightStyle, tags } from '@codemirror/highlight';

@Component({
  selector: 'app-promql-editor',
  templateUrl: './promql-editor.component.html',
  styleUrls: ['./promql-editor.component.scss']
})
export class PromqlEditorComponent implements OnInit, AfterViewInit {
  @Input()
  expr = '';
  @Input()
  id = '';

  // promQLHighlightMaterialTheme is based on the material theme defined here:
  // https://codemirror.net/theme/material.css
  private promQLHighlightMaterialTheme = HighlightStyle.define(
    {
      tag: tags.deleted,
      textDecoration: 'line-through',
    },
    {
      tag: tags.inserted,
      textDecoration: 'underline',
    },
    {
      tag: tags.link,
      textDecoration: 'underline',
    },
    {
      tag: tags.strong,
      fontWeight: 'bold',
    },
    {
      tag: tags.emphasis,
      fontStyle: 'italic',
    },
    {
      tag: tags.invalid,
      color: '#f00',
    },
    {
      tag: tags.keyword,
      color: '#C792EA',
    },
    {
      tag: tags.operator,
      color: '#89DDFF',
    },
    {
      tag: tags.atom,
      color: '#F78C6C',
    },
    {
      tag: tags.number,
      color: '#FF5370',
    },
    {
      tag: tags.string,
      color: '#99b867',
    },
    {
      tag: [tags.escape, tags.regexp],
      color: '#e40',
    },
    {
      tag: tags.definition(tags.variableName),
      color: '#f07178',
    },
    {
      tag: tags.labelName,
      color: '#f07178',
    },
    {
      tag: tags.typeName,
      color: '#085',
    },
    {
      tag: tags.function(tags.variableName),
      color: '#C792EA',
    },
    {
      tag: tags.definition(tags.propertyName),
      color: '#00c',
    },
    {
      tag: tags.comment,
      color: '#546e7a',
    }
  );

  private customTheme = EditorView.theme({
    $completionDetail: {
      marginLeft: '0.5em',
      float: 'right',
      color: '#9d4040',
    },
    $completionMatchedText: {
      color: '#83080a',
      textDecoration: 'none',
      fontWeight: 'bold',
    },
  });

  constructor() {
  }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    const doc = document.getElementById(`${this.id}`);
    if (doc !== null) {
      const promQLExtension = new PromQLExtension();
      const view = new EditorView({
        state: EditorState.create({
          extensions: [
            basicSetup,
            promQLExtension.asExtension(),
            this.promQLHighlightMaterialTheme,
            this.customTheme, EditorView.editable.of(false),
            EditorView.lineWrapping
          ],
          doc: this.expr,
        }),
        parent: doc
      });
    }
  }
}
