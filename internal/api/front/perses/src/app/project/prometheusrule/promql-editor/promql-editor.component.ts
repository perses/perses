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
          extensions: [basicSetup, promQLExtension.asExtension()],
          doc: this.expr,
        }),
        parent: doc
      });
    }
  }
}
