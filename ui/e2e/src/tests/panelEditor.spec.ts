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

test.use({
  dashboardName: 'Panels',
});

test.describe('Dashboard: Panel Editor', () => {
  test('requires confirmation to discard changes', async ({ dashboardPage }) => {
    await dashboardPage.startEditing();
    await dashboardPage.addPanel();
    await dashboardPage.panelEditor.isVisible();
    const panelEditor = dashboardPage.getPanelEditor();
    await panelEditor.selectType('Markdown');
    await panelEditor.cancelButton.click();

    const discardChangesConfirmationDialog = dashboardPage.getDialog('Discard Changes');
    await expect(discardChangesConfirmationDialog).toBeVisible();

    // clicking "Cancel" should do nothing and keep current changes
    await discardChangesConfirmationDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dashboardPage.panelEditor).toBeVisible();
    await expect(dashboardPage.panelEditor.getByLabel(/^Type/)).toContainText('Markdown');

    // clicking "Discard Changes" should discard changes
    await panelEditor.cancelButton.click();
    await discardChangesConfirmationDialog.getByRole('button', { name: 'Discard Changes' }).click();
    await panelEditor.isClosed();
    await expect(discardChangesConfirmationDialog).toBeHidden();
  });

  test('should not require confirmation to discard changes when there is no change', async ({ dashboardPage }) => {
    await dashboardPage.startEditing();
    await dashboardPage.addPanel();
    const panelEditor = dashboardPage.getPanelEditor();
    await panelEditor.isVisible();
    await panelEditor.cancelButton.click();
    const discardChangesConfirmationDialog = dashboardPage.getDialog('Discard Changes');
    await expect(discardChangesConfirmationDialog).toBeHidden();
    await panelEditor.isClosed();
  });

  test('should reset y axis panel option to default', async ({ dashboardPage }) => {
    await dashboardPage.startEditing();
    await dashboardPage.addPanel();
    const panelEditor = dashboardPage.getPanelEditor();
    await panelEditor.isVisible();
    const settingsTab = dashboardPage.page.getByRole('tab', { name: 'Settings', exact: true });
    await settingsTab.click();
    const resetButton = dashboardPage.page.getByRole('button', { name: 'Reset To Defaults', exact: true });
    await resetButton.click();
    const EXAMPLE_AXIS_LABEL = 'Memory';
    const yAxisLabelInput = dashboardPage.page.getByRole('textbox', { name: 'enter y axis label' });
    await yAxisLabelInput.clear();
    await yAxisLabelInput.type(EXAMPLE_AXIS_LABEL, { delay: 100 });
    const yAxisLabelText = dashboardPage.page.getByText(EXAMPLE_AXIS_LABEL);
    await expect(yAxisLabelText).toBeVisible();
    await resetButton.click();
    expect(await yAxisLabelText.count()).toEqual(0);
  });
});
