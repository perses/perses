// Copyright 2021 The Perses Authors
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

import { ContentRef, DashboardSpec } from './dashboard';
import { JsonObject } from './definitions';

export interface LayoutRef extends JsonObject {
  $ref: LayoutPointer;
}

export type LayoutPointer = `#/layouts/${string}`;

export interface PanelRef extends JsonObject {
  $ref: PanelPointer;
}

export type PanelPointer = `#/panels/${string}`;

/**
 * Check whether a ContentRef is a LayoutRef.
 */
export function isLayoutRef(contentRef: ContentRef): contentRef is LayoutRef {
  return contentRef.$ref.startsWith('#/layouts/');
}

/**
 * Resolve a LayoutRef (JSON reference) against the provided DashboardSpec to
 * a LayoutDefinition.
 */
export function resolveLayoutRef(spec: DashboardSpec, layoutRef: LayoutRef) {
  const layoutsKey = layoutRef.$ref.substring(10);
  const layoutDefinition = spec.layouts[layoutsKey];
  if (layoutDefinition === undefined) {
    throw new Error(`Could not resolve layouts reference ${layoutRef.$ref}`);
  }
  return layoutDefinition;
}

/**
 * Resolve a PanelRef (JSON reference) against the provided DashboardSpec to
 * a PanelDefinition.
 */
export function resolvePanelRef(spec: DashboardSpec, panelRef: PanelRef) {
  const panelsKey = panelRef.$ref.substring(9);
  const panelDefinition = spec.panels[panelsKey];
  if (panelDefinition === undefined) {
    throw new Error(`Could not resolve panels reference ${panelRef.$ref}`);
  }
  return panelDefinition;
}
