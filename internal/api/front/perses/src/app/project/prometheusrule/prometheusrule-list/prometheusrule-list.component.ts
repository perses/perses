import { Component, OnInit } from '@angular/core';
import { PrometheusRuleService } from '../prometheusrule.service';
import { PrometheusRuleModel, RuleGroup } from '../prometheusrule.model';

@Component({
  selector: 'app-prometheusrule-list',
  templateUrl: './prometheusrule-list.component.html',
  styleUrls: ['./prometheusrule-list.component.scss']
})
export class PrometheusRuleListComponent implements OnInit {

  isLoading = false;
  rules: PrometheusRuleModel[] = [];

  constructor(private service: PrometheusRuleService) {
  }

  ngOnInit(): void {
    this.getRules();
  }

  public countRules(groups: RuleGroup[]): number {
    let result = 0;
    for (const group of groups) {
      result = result + group.rules.length;
    }
    return result;
  }

  private getRules(): void {
    this.isLoading = true;
    this.service.list('perses').subscribe(
      responses => {
        this.rules = responses;
        this.isLoading = false;
      }
    );
  }
}
