// Copyright 2023 The Perses Authors
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

import { Locator } from '@playwright/test';

export class SecretEditor {
  readonly container: Locator;

  readonly saveButton: Locator;

  readonly nameInput: Locator;
  readonly basicAuthUsernameInput: Locator;
  readonly basicAuthPasswordInput: Locator;

  constructor(container: Locator) {
    this.container = container;

    this.saveButton = container.getByRole('button', { name: 'Save' });

    this.nameInput = container.locator('input[name="metadata.name"]');
    this.basicAuthUsernameInput = container.locator('input[name="spec.basicAuth.username"]');
    this.basicAuthPasswordInput = container.locator('input[name="spec.basicAuth.password"]');
  }

  async setName(name: string) {
    await this.nameInput.clear();
    await this.nameInput.type(name);
  }

  async setBasicAuthUsername(username: string) {
    await this.basicAuthUsernameInput.clear();
    await this.basicAuthUsernameInput.type(username);
  }

  async setBasicAuthPassword(password: string) {
    await this.basicAuthPasswordInput.clear();
    await this.basicAuthPasswordInput.type(password);
  }
}
