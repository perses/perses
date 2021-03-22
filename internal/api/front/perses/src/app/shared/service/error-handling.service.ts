import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { CustomError } from '../model/error.model';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {

  private static defaultStatusText = 'Something horrible occurred';

  handleHTTPError(res: HttpErrorResponse): Observable<never> {
    const error = {
      status: res.status
    } as CustomError;

    error.message = res.error.message || '';
    error.statusText = res.statusText || ErrorHandlingService.defaultStatusText;
    return throwError(error);
  }
}
