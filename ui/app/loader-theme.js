// Copyright The Perses Authors
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

// Applies the theme chosen in Perses to the loading screen of index.html, which otherwise follows the theme of the OS.
// index.html loads it from <head>, so it runs before the loading screen is displayed. It's a separate file and not an
// inline script, because the Content-Security-Policy sent with the pages of the UI blocks the inline scripts.
(() => {
  try {
    // Written by the app, see DARK_MODE_PREFERENCE_KEY in src/context/DarkMode.tsx. It's null until a theme is chosen.
    const isDarkModeEnabled = JSON.parse(window.localStorage.getItem('PERSES_ENABLE_DARK_MODE'));
    if (typeof isDarkModeEnabled === 'boolean') {
      document.documentElement.dataset.loaderTheme = isDarkModeEnabled ? 'dark' : 'light';
    }
  } catch {
    // The local storage is unavailable (e.g. blocked by the browser) or holds an invalid value: keep the OS theme.
  }
})();
