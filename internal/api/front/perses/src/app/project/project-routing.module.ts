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
import { ProjectTemplateComponent } from './project-template/project-template.component';
import { NgModule } from '@angular/core';
import { ProjectGuard } from './project.guard';

const PROJECT_ROUTES: Routes = [
  {
    path: 'projects/:project',
    component: ProjectTemplateComponent,
    children: [
      {
        path: 'prometheusrules',
        canActivate: [ProjectGuard],
        loadChildren: () => import('./prometheusrule/prometheusrule.module').then(m => m.PrometheusRuleModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(PROJECT_ROUTES)],
  exports: [RouterModule]
})
export class ProjectRoutingModule {
}
