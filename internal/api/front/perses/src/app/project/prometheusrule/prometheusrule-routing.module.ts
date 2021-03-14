import {RouterModule, Routes} from "@angular/router";
import {PrometheusRuleListComponent} from "./prometheusrule-list/prometheusrule-list.component";
import {NgModule} from "@angular/core";

const PROMETHEUSRULE_ROUTES: Routes = [
  {
    path: '',
    component: PrometheusRuleListComponent
  }
]

@NgModule({
  imports: [RouterModule.forChild(PROMETHEUSRULE_ROUTES)],
  exports: [RouterModule]
})
export class PrometheusRuleRoutingModule {
}
