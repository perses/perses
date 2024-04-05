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
	modelAPI "github.com/perses/perses/pkg/model/api"
)

type roboticLogin struct {
	writer               io.Writer
	externalAuthKind     externalAuthKind
	externalAuthProvider string
	clientID             string
	clientSecret         string
	apiClient            api.ClientInterface
}

func (l *roboticLogin) Login() (*modelAPI.AuthResponse, error) {
	return l.apiClient.Auth().ClientCredentialsToken(string(l.externalAuthKind), l.externalAuthProvider, l.clientID, l.clientSecret)
}

func (l *roboticLogin) SetMissingInput() error {
	if len(l.clientID) == 0 {
		input := huh.NewInput().Title("Client ID").Value(&l.clientID)
		if err := input.Run(); err != nil {
			return err
		}
		if err := output.HandleString(l.writer, input.View()); err != nil {
			return err
		}
	}
	if len(l.clientSecret) == 0 {
		input := huh.NewInput().Title("Client Secret").EchoMode(huh.EchoModeNone).Value(&l.clientSecret)
		if err := input.Run(); err != nil {
			return err
		}
		if err := output.HandleString(l.writer, input.View()); err != nil {
			return err
		}
	}
	return nil
}
