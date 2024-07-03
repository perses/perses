// Copyright 2024 The Perses Authors
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

import { Metadata } from './resource';

export interface NativeProvider {
  password?: string;
}

export interface OAuthProvider {
  issuer?: string;
  email?: string;
  subject?: string;
}

export interface UserSpec {
  firstName?: string;
  lastName?: string;
  nativeProvider?: NativeProvider;
  oauthProviders?: OAuthProvider[];
}

export interface UserResource {
  kind: 'User';
  metadata: Metadata;
  spec: UserSpec;
}
