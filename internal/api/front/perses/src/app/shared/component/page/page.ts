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

import { ChangeDetectionStrategy, Component, Directive, HostBinding, Input, ViewEncapsulation } from '@angular/core';
import { booleanInput } from '../../utils/angular-input.util';

@Directive({
  selector: 'app-page-header, [app-page-header], [appPageHeader]'
})
// tslint:disable-next-line:directive-class-suffix
export class PageHeader {
  @HostBinding('class.app-page-header') appPageHeader = true;
}

@Directive({
  selector: 'app-page-sub-content, [app-page-sub-content], [appPageSubContent]'
})
// tslint:disable-next-line:directive-class-suffix
export class PageSubContent {
  @HostBinding('class.app-page-sub-content') appPageSubContent = true;
}

@Component({
  selector: 'app-page',
  exportAs: 'appPage',
  templateUrl: 'page.html',
  styleUrls: ['page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageComponent {
  private useMargin = true;

  @Input() set noMargin(value: string | boolean) {
    this.useMargin = !booleanInput(value);
  }

  @HostBinding('class.app-page') get appPage(): boolean {
    return this.useMargin;
  }

  @HostBinding('class.app-page-no-margin') get appPageNoMargin(): boolean {
    return !this.useMargin;
  }
}

@Component({
  selector: 'app-page-content',
  exportAs: 'appPageContent',
  templateUrl: 'page-content.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageContentComponent {
  @HostBinding('class.app-page-content') appPageContent = true;
}
