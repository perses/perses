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

import { useCallback } from 'react';
import { EventProperties } from '@perses-dev/core';
import { useAnalytics } from '../context/Analytics';

/**
 * Helper to convert action verb to past tense.
 * @param action - Action verb (create, edit, delete, duplicate, update)
 * @returns Past tense form
 */
function toPastTense(action: string): string {
  const pastTenseMap: Record<string, string> = {
    create: 'Created',
    edit: 'Updated',
    update: 'Updated',
    delete: 'Deleted',
    duplicate: 'Duplicated',
    rename: 'Renamed',
  };
  return pastTenseMap[action.toLowerCase()] || action;
}

/**
 * Hook for tracking dialog interactions with descriptive event names.
 * Generates event names in the format: "<Resource> <PastTenseAction>"
 * Example: "Dashboard Created", "Variable Updated", "Datasource Deleted"
 *
 * @param resourceKind - Resource kind (e.g., 'Dashboard', 'Variable', 'Datasource')
 * @param action - Action type (e.g., 'create', 'edit', 'duplicate', 'delete')
 * @returns Object with trackSubmit and trackCancel methods
 *
 * @example
 * const dialogAnalytics = useDialogAnalytics('Dashboard', 'create');
 *
 * // On successful submission - tracks event "Dashboard Created"
 * dialogAnalytics.trackSubmit(true);
 *
 * // On failed submission - tracks event "Dashboard Creation Failed"
 * dialogAnalytics.trackSubmit(false);
 *
 * // On cancel - tracks event "Dashboard Creation Cancelled"
 * dialogAnalytics.trackCancel();
 */
export function useDialogAnalytics(resourceKind: string, action: string) {
  const { trackEvent } = useAnalytics();

  /**
   * Track dialog submission with success/failure status.
   * Event: "{Resource} {PastTense}" (e.g., "Dashboard Created")
   * Properties include: submit=true, success=true/false
   * @param success - Whether the submission was successful
   * @param additionalProperties - Optional additional properties to include
   */
  const trackSubmit = useCallback(
    (success: boolean, additionalProperties?: EventProperties) => {
      const eventName = `${resourceKind} ${toPastTense(action)}`;

      trackEvent(eventName, {
        submit: true,
        success,
        ...additionalProperties,
      });
    },
    [trackEvent, resourceKind, action]
  );

  /**
   * Track dialog cancellation.
   * Event: "{Resource} {PastTense}" (e.g., "Dashboard Created")
   * Properties: submit=false
   * @param additionalProperties - Optional additional properties to include
   */
  const trackCancel = useCallback(
    (additionalProperties?: EventProperties) => {
      const eventName = `${resourceKind} ${toPastTense(action)}`;

      trackEvent(eventName, {
        submit: false,
        ...additionalProperties,
      });
    },
    [trackEvent, resourceKind, action]
  );

  return { trackSubmit, trackCancel };
}
