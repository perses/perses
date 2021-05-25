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

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ToastrModule } from 'ngx-toastr';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PromqlEditorComponent } from './component/promql-editor/promql-editor.component';
import { FormsModule } from '@angular/forms';
import { AngularSplitModule } from 'angular-split';
import { PageModule } from './component/page/page.module';
import { InputBoxComponent } from './component/input-box/input-box.component';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from "@angular/material/divider";
import { LineComponent } from './component/line/line.component';

@NgModule({
  declarations: [
    InputBoxComponent,
    LineComponent,
    PromqlEditorComponent,
  ],
  exports: [
    AngularSplitModule,
    InputBoxComponent,
    CommonModule,
    HttpClientModule,
    FormsModule,
    LineComponent,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatToolbarModule,
    PromqlEditorComponent,
    PageModule
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ToastrModule.forRoot(),
    MatInputModule,
  ]
})
export class SharedModule {
}
