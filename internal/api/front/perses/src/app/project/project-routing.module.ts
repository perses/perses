import {RouterModule, Routes} from "@angular/router";
import {ProjectTemplateComponent} from "./project-template/project-template.component";
import {NgModule} from "@angular/core";

const PROJECT_ROUTES: Routes = [
  {
    path: 'projects/:project',
    component: ProjectTemplateComponent,
    children: [
      {
        path: 'prometheusrules',
        loadChildren: () => import('./prometheusrule/prometheusrule.module').then(m => m.PrometheusRuleModule)
      }
    ]
  }
]

@NgModule({
  imports: [RouterModule.forChild(PROJECT_ROUTES)],
  exports: [RouterModule]
})
export class ProjectRoutingModule {
}
