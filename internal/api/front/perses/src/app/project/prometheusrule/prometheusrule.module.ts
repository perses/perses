import { NgModule } from '@angular/core';
import { PrometheusRuleListComponent } from './prometheusrule-list/prometheusrule-list.component';
import { PrometheusRuleRoutingModule } from './prometheusrule-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';

@NgModule({
  declarations: [PrometheusRuleListComponent],
  imports: [
    MatDividerModule,
    MatExpansionModule,
    PrometheusRuleRoutingModule,
    SharedModule,
  ]
})
export class PrometheusRuleModule {
}
