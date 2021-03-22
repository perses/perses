import { Injectable } from '@angular/core';
import { IndividualConfig, ToastrService } from 'ngx-toastr';
import { CustomError } from '../model/error.model';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private defaultConfig = {
    positionClass: 'toast-bottom-right',
    timeOut: 10000,
    closeButton: true
  } as Partial<IndividualConfig>;

  constructor(private toasterService: ToastrService) {
  }

  error(error: CustomError): void {
    this.toasterService.error(error.statusText, error.message, this.defaultConfig);
  }

  success(message: string): void {
    this.toasterService.success(message, '', this.defaultConfig);
  }
}
