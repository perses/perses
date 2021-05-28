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

import { Component, ElementRef, HostBinding, Input, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-line',
  exportAs: 'appLine',
  templateUrl: 'line.component.html',
  styleUrls: ['line.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LineComponent implements OnInit {
  // tslint:disable-next-line:variable-name
  private _justifyContent: 'space-between' | 'flex-start' | 'flex-end' = 'space-between';
  @Input()
  set justifyContent(content: 'space-between' | 'flex-start' | 'flex-end') {
    this._justifyContent = content;
  }

  get justifyContent(): 'space-between' | 'flex-start' | 'flex-end' {
    return this._justifyContent;
  }

  @HostBinding('class.app-line') appLine = true;

  constructor(private elementRef: ElementRef<HTMLElement>) {
  }

  ngOnInit(): void {
    this.elementRef.nativeElement.style.justifyContent = this._justifyContent;
  }

}
