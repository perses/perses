import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {PrometheusRuleModel} from './prometheusrule.model';
import {UrlBuilderUtil} from '../../shared/utils/url-builder.util';

@Injectable({
  providedIn: 'root'
})
export class PrometheusRuleService {
  private prometheusRuleResource = 'prometheusrules';

  constructor(private http: HttpClient) {
  }

  list(project: string): Observable<PrometheusRuleModel[]> {
    const url = new UrlBuilderUtil()
      .setResource(this.prometheusRuleResource)
      .setProject(project);

    return this.http.get<PrometheusRuleModel[]>(url.build());
  }
}
