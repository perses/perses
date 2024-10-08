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

package login

import (
	"io"

	"github.com/charmbracelet/huh"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/pkg/client/api"
	"golang.org/x/oauth2"
)

type nativeLogin struct {
	writer    io.Writer
	username  string
	password  string
	apiClient api.ClientInterface
}

func (l *nativeLogin) Login() (*oauth2.Token, error) {
	return l.apiClient.Auth().Login(l.username, l.password)
}

func (l *nativeLogin) SetMissingInput() error {
	if len(l.username) == 0 {
		input := huh.NewInput().Title("Username").Value(&l.username)
		if err := input.Run(); err != nil {
			return err
		}
		if err := output.HandleString(l.writer, input.View()); err != nil {
			return err
		}
	}
	if len(l.password) == 0 {
		input := huh.NewInput().Title("Password").EchoMode(huh.EchoModeNone).Value(&l.password)
		if err := input.Run(); err != nil {
			return err
		}
		if err := output.HandleString(l.writer, input.View()); err != nil {
			return err
		}
	}
	return nil
}
