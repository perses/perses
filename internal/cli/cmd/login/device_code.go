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
	"fmt"
	"io"

	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/pkg/client/api"
	"golang.org/x/oauth2"
)

type deviceCodeLogin struct {
	writer               io.Writer
	externalAuthKind     externalAuthKind
	externalAuthProvider string
	apiClient            api.ClientInterface
}

func (l *deviceCodeLogin) Login() (*oauth2.Token, error) {
	deviceCodeResponse, err := l.apiClient.Auth().DeviceCode(string(l.externalAuthKind), l.externalAuthProvider)
	if err != nil {
		return nil, err
	}

	// Display the user code and verification URL
	if outErr := output.HandleString(l.writer, fmt.Sprintf("Go to %s and enter this user code: %s\nWaiting for user to authorize the application...", deviceCodeResponse.VerificationURI, deviceCodeResponse.UserCode)); err != nil {
		return nil, outErr
	}

	return l.apiClient.Auth().DeviceAccessToken(string(l.externalAuthKind), l.externalAuthProvider, deviceCodeResponse)
}

func (l *deviceCodeLogin) SetMissingInput() error {
	return nil
}
