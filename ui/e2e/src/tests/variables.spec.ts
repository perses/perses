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
  dashboardName: 'Variables',
  modifiesDashboard: true,
});

test.describe('Dashboard: Variables', () => {
  test('can add simple text variable', async ({ dashboardPage, page }) => {
    await dashboardPage.startEditing();
    await dashboardPage.startEditingVariables();

    const variableEditor = dashboardPage.getVariableEditor();
    await variableEditor.addVariable();
    await variableEditor.setName('text_var');
    await variableEditor.setDisplayLabel('Text Var');
    await variableEditor.selectType('Text');
    await variableEditor.setTextValue('test value');
    await variableEditor.updateButton.click();

    // Includes one for the table header.
    await expect(variableEditor.tableRows).toHaveCount(2);
    await expect(variableEditor.tableRowHeadings).toContainText(['text_var']);

    await variableEditor.applyChanges();
    await dashboardPage.saveChanges();

    await expect(dashboardPage.variableListItems).toHaveCount(1);
    await expect(dashboardPage.variableListItems).toContainText([/Text Var/]);
  });

  test('can add simple list variable', async ({ dashboardPage }) => {
    await dashboardPage.startEditing();
    await dashboardPage.startEditingVariables();
    const variableEditor = dashboardPage.getVariableEditor();

    await variableEditor.addVariable();
    await variableEditor.setName('list_var');
    await variableEditor.setDisplayLabel('List Var');
    await variableEditor.selectType('list');
    await variableEditor.selectSource('Custom List');
    await variableEditor.updateButton.click();

    // Includes one for the table header.
    await expect(variableEditor.tableRows).toHaveCount(2);
    await expect(variableEditor.tableRowHeadings).toContainText(['list_var']);

    await variableEditor.applyChanges();
    await dashboardPage.saveChanges();

    await expect(dashboardPage.variableListItems).toHaveCount(1);
    await expect(dashboardPage.variableListItems).toContainText([/List Var/]);
  });
});
