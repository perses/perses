import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  declarations: [],
  exports: [
    CommonModule,
    HttpClientModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  imports: [
    CommonModule,
    HttpClientModule
  ]
})
export class SharedModule {
}
