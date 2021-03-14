import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { PrometheusRuleListComponent } from './prometheusrule-list/prometheusrule-list.component';
import {PrometheusRuleRoutingModule} from "./prometheusrule-routing.module";

@NgModule({
  declarations: [PrometheusRuleListComponent],
  imports: [
    CommonModule,
    PrometheusRuleRoutingModule,
  ]
})
export class PrometheusRuleModule {
}
