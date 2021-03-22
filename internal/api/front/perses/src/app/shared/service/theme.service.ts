import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private themeKey = 'perses-dark-theme-enabled';
  private darkThemeSubject = new BehaviorSubject<boolean>(true);

  public get darkThemeEnable(): Observable<boolean> {
    return this.darkThemeSubject.asObservable();
  }

  constructor() {
    this.darkThemeSubject.next(localStorage.getItem(this.themeKey) === 'true');
  }

  enableDarkTheme(enable: boolean): void {
    localStorage.setItem(this.themeKey, String(enable));
    this.darkThemeSubject.next(enable);
  }
}
