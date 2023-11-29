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

package api

import (
	"encoding/json"
	"fmt"
)

type Auth struct {
	Login    string `json:"login"`
	Password string `json:"password"`
}

func (u *Auth) UnmarshalJSON(data []byte) error {
	type plain Auth
	var tmp Auth
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if len(tmp.Login) == 0 {
		return fmt.Errorf("login cannot be empty")
	}
	if len(tmp.Password) == 0 {
		return fmt.Errorf("password cannot be empty")
	}
	u.Password = tmp.Password
	u.Login = tmp.Login
	return nil
}

type AuthResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken,omitempty"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refreshToken"`
}

func (r *RefreshRequest) UnmarshalJSON(data []byte) error {
	var tmp RefreshRequest
	type plain RefreshRequest
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*r = tmp
	return nil
}

func (r *RefreshRequest) validate() error {
	if len(r.RefreshToken) == 0 {
		return fmt.Errorf("refreshToken cannot be empty")
	}
	return nil
}
