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

import { RouterModule, Routes } from '@angular/router';
import { DashboardDetailsComponent } from './dashboard-details/dashboard-details.component';
import { DashboardListComponent } from './dashboard-list/dashboard-list.component';
import { NgModule } from '@angular/core';
import { DashboardGuard } from './dashboard.guard';
import { DashboardDetailsGuard } from './dashboard-details/dashboard-details.guard';

const ROUTES: Routes = [
  {
    path: '',
    canActivate: [DashboardGuard],
    component: DashboardListComponent
  },
  {
    path: ':dashboard',
    canActivate: [DashboardGuard, DashboardDetailsGuard],
    component: DashboardDetailsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  exports: [RouterModule]
})
export class DashboardRoutingModule {
}
