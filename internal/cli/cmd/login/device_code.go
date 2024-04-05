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
	"context"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/pkg/client/api"
	"github.com/perses/perses/pkg/client/perseshttp"
	modelAPI "github.com/perses/perses/pkg/model/api"
)

type deviceCodeLogin struct {
	writer               io.Writer
	externalAuthKind     externalAuthKind
	externalAuthProvider string
	apiClient            api.ClientInterface
}

func (l *deviceCodeLogin) Login() (*modelAPI.AuthResponse, error) {
	deviceCodeResponse, err := l.apiClient.Auth().DeviceCode(string(l.externalAuthKind), l.externalAuthProvider)
	if err != nil {
		return nil, err
	}

	// Display the user code and verification URL
	if outErr := output.HandleString(l.writer, fmt.Sprintf("Go to %s and enter this user code: %s\nWaiting for user to authorize the application...", deviceCodeResponse.VerificationURI, deviceCodeResponse.UserCode)); err != nil {
		return nil, outErr
	}

	// Compute the expiry and interval from the response
	ctx := context.Background()
	if !deviceCodeResponse.Expiry.IsZero() {
		var cancel context.CancelFunc
		ctx, cancel = context.WithDeadline(ctx, deviceCodeResponse.Expiry)
		defer cancel()
	}
	interval := deviceCodeResponse.Interval
	if interval == 0 {
		interval = 5
	}

	// Poll for an access token
	ticker := time.NewTicker(time.Duration(interval) * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-ticker.C:
			tokenResponse, tokenErr := l.apiClient.Auth().DeviceAccessToken(string(l.externalAuthKind), l.externalAuthProvider, deviceCodeResponse.DeviceCode)
			if tokenErr == nil {
				// Handle the access token
				return tokenResponse, nil
			}

			reqErr := &perseshttp.RequestError{}
			if errors.As(tokenErr, &reqErr) && reqErr.Err != nil {
				oauthErr := &modelAPI.OAuthError{}
				if errors.As(reqErr.Err, &oauthErr) {
					switch oauthErr.ErrorCode {
					case errSlowDown:
						// https://datatracker.ietf.org/doc/html/rfc8628#section-3.5
						// "the interval MUST be increased by 5 seconds for this and all subsequent requests"
						interval += 5
						ticker.Reset(time.Duration(interval) * time.Second)
						continue
					case errAuthorizationPending:
						// Do nothing.
						continue
					default:
						return nil, oauthErr
					}
				}
				return nil, reqErr.Err
			}
			return nil, tokenErr
		}
	}
}

func (l *deviceCodeLogin) SetMissingInput() error {
	return nil
}
