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
import { DashboardDetailsComponent } from './dashboard-details/dashboard-details.component';
import { SharedModule } from '../../shared/shared.module';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardVariablesComponent } from './dashboard-details/dashboard-variables/dashboard-variables.component';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';


@NgModule({
  declarations: [DashboardDetailsComponent, DashboardVariablesComponent],
  imports: [
    SharedModule,
    DashboardRoutingModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
  ]
})
export class DashboardModule {
}
