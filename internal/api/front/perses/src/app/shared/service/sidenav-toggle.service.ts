// Copyright 2021 Amadeus s.a.s
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ScreenSizeService } from './screen-size.service';

// SidenavToggleService is used to transmit the click from the main toolbar to the project sidenav.
// It's used only when the screen is too small to contain the sidenav
@Injectable({
  providedIn: 'root'
})
export class SidenavToggleService {
  private toggleSubject = new BehaviorSubject<boolean>(true);

  constructor(private screenSize: ScreenSizeService) {
    this.screenSize.mobileQueryObserver.subscribe(
      result => {
        this.toggleSubject.next(!result.matches);
      }
    );
  }

  public nextToggle(): void {
    this.toggleSubject.next(!this.toggleSubject.value);
  }

  public get toggle(): Observable<boolean> {
    return this.toggleSubject.asObservable();
  }

}
