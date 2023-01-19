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

import { test, expect } from '../fixtures/dashboardTest';
import { PanelEditor } from '../pages/PanelEditor';

test.use({
  dashboardName: 'Panels',
});

test.describe('Dashboard: Panel Editor', () => {
  test('should show discard changes confirmation dialog', async ({ dashboardPage }) => {
    await dashboardPage.startEditing();
    await dashboardPage.addPanel();
    await dashboardPage.panelEditor.isVisible();
    const panelEditor = new PanelEditor(dashboardPage.panelEditor);
    await panelEditor.selectType('Markdown');
    await panelEditor.cancelButton.click();

    await expect(dashboardPage.discardChangesConfirmationDialog).toBeVisible();

    // clicking "Cancel" should do nothing and keep current changes
    await dashboardPage.discardChangesConfirmationDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dashboardPage.panelEditor).toBeVisible();
    await expect(dashboardPage.panelEditor.getByLabel(/^Type/)).toContainText('Markdown');

    // clicking "Discard Changes" should discard changes
    await panelEditor.cancelButton.click();
    await dashboardPage.discardChangesConfirmationDialog.getByRole('button', { name: 'Discard Changes' }).click();
    await expect(dashboardPage.panelEditor).toBeHidden();
    await expect(dashboardPage.discardChangesConfirmationDialog).toBeHidden();
  });
});
