import { Observable } from 'rxjs';
import { UrlTree } from '@angular/router';

export type CanActivateReturnType = Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree;
