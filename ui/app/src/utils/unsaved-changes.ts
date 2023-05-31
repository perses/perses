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

// import { useContext, useEffect, useCallback, useRef } from 'react';
// import { UnregisterCallback, Location, State, Transition } from 'history';
// import { useNavigate, UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';
// import { useDiscardChangesConfirmationDialog, DiscardChangesConfirmationDialogState } from '@perses-dev/dashboards';

export {};
// /**
//  * Block navigation if there is any unsaved change
//  * @param isEditMode
//  * @param isModified
//  * @returns the open/close state of unsaved changes confirmation dialog and a callback to continue navigation
//  */
// export function useUnsavedChanges(
//   isEditMode: boolean,
//   isModified: boolean,
//   discardChangesConfirmationDialogState: DiscardChangesConfirmationDialogState
// ) {
//   const history = useNavigate();
//   const { openDiscardChangesConfirmationDialog } = useDiscardChangesConfirmationDialog();

//   // alert users of unsaved changes if they close/refresh browser
//   useEffect(() => {
//     const onBeforeUnload = (event: BeforeUnloadEvent) => {
//       event.preventDefault();
//       const returnString = 'Are you sure you want to leave the page?';
//       event.returnValue = returnString;
//       return returnString;
//     };

//     if (isEditMode && isModified) {
//       window.addEventListener('beforeunload', onBeforeUnload);
//     } else {
//       window.removeEventListener('beforeunload', onBeforeUnload);
//     }

//     return () => window.removeEventListener('beforeunload', onBeforeUnload);
//   }, [isEditMode, isModified]);

//   // block users from navigating away if they have unsaved changes
//   const locationRef = useRef<Location>();
//   const unblockRef = useRef<UnregisterCallback>();
//   useEffect(() => {
//     if (isEditMode && isModified) {
//       unblockRef.current = history.block((location) => {
//         if (location.pathname !== history.location.pathname) {
//           locationRef.current = location; // save the location where user plans to navigate
//           openDiscardChangesConfirmationDialog(discardChangesConfirmationDialogState);
//           return false; // returning false blocks navigation
//         }
//       });
//     } else {
//       // call unblock first before removing previous block function
//       if (unblockRef.current) {
//         unblockRef.current();
//       }
//       locationRef.current = undefined;
//       unblockRef.current = undefined;
//     }
//   }, [isEditMode, isModified, history, openDiscardChangesConfirmationDialog, discardChangesConfirmationDialogState]);

//   /**
//    * Callback to proceed with navigation
//    * @returns true if successfully unblocks navigation and navigates to previously blocked location
//    */
//   const handleNavigation = () => {
//     if (unblockRef.current && locationRef.current) {
//       unblockRef.current();
//       history.push(locationRef.current);
//       unblockRef.current = undefined;
//       locationRef.current = undefined;
//       return true;
//     }
//     return false;
//   };

//   return {
//     handleNavigation,
//   };
// }

// interface Blocker<S extends State = object | null> {
//   (tx: Transition<S>): void;
// }

// /**
//  * Blocks all navigation attempts. This is useful for preventing the page from changing.
//  * Workaround for React Router v6, more details: https://github.com/remix-run/react-router/issues/8139#issuecomment-953816315
//  * https://gist.github.com/rmorse/426ffcc579922a82749934826fa9f743
//  */
// export function useBlocker(blocker: Blocker, when = true): void {
//   invariant(
//     useInRouterContext(),
//     // TODO: This error is probably because they somehow have 2 versions of the
//     // router loaded. We can help them understand how to avoid that.
//     `useBlocker() may be used only in the context of a <Router> component.`
//   );

//   const { navigator } = React.useContext(NavigationContext);

//   React.useEffect(() => {
//     if (!when) return;

//     const unblock = navigator.block((tx: Transition) => {
//       const autoUnblockingTx = {
//         ...tx,
//         retry() {
//           // Automatically unblock the transition so it can play all the way
//           // through before retrying it. TODO: Figure out how to re-enable
//           // this block if the transition is cancelled for some reason.
//           unblock();
//           tx.retry();
//         },
//       };

//       blocker(autoUnblockingTx);
//     });

//     return unblock;
//   }, [navigator, blocker, when]);
// }
