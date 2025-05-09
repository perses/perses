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

package transport

import (
	"net/http"
	"sync"

	"github.com/perses/perses/pkg/client/api/auth"
	"github.com/perses/perses/pkg/client/perseshttp"
	modelAPI "github.com/perses/perses/pkg/model/api"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"golang.org/x/oauth2"
)

type tokenManager struct {
	authClient auth.Interface
	mutex      sync.Mutex
	token      *oauth2.Token
	auth       modelAPI.Auth
}

func (t *tokenManager) getToken() (*oauth2.Token, error) {
	t.mutex.Lock()
	defer t.mutex.Unlock()
	var err error
	// if the token is empty, then we need to authenticate
	if t.token == nil {
		t.token, err = t.authClient.Login(t.auth.Login, t.auth.Password)
		return t.token, err
	}

	if !t.token.Valid() {
		// Then we need to refresh the token or to authenticate.
		t.token, err = t.authClient.Refresh(t.token.RefreshToken)
		if err != nil {
			if requestErr, ok := err.(*perseshttp.RequestError); ok {
				if requestErr.StatusCode == http.StatusBadRequest {
					// Then it means the refresh token doesn't work anymore and we need to authenticate
					t.token, err = t.authClient.Login(t.auth.Login, t.auth.Password)
					return t.token, err
				}
			}
			// Otherwise, there is another error that shall be managed at upper level
			return nil, err
		}
	}
	return t.token, nil
}

func New(baseURL *common.URL, base http.RoundTripper, nativeAuth modelAPI.Auth) http.RoundTripper {
	client := auth.New(&perseshttp.RESTClient{
		BaseURL: baseURL,
		Client:  &http.Client{Transport: base},
	})
	return &transport{
		tokenManager: &tokenManager{authClient: client, auth: nativeAuth},
		base:         base,
	}
}

type transport struct {
	tokenManager *tokenManager
	// base is the base RoundTripper used to make HTTP requests.
	base http.RoundTripper
}

func (t *transport) RoundTrip(req *http.Request) (*http.Response, error) {
	reqBodyClosed := false
	if req.Body != nil {
		defer func() {
			if !reqBodyClosed {
				_ = req.Body.Close()
			}
		}()
	}
	token, err := t.tokenManager.getToken()
	if err != nil {
		return nil, err
	}
	req2 := cloneRequest(req) // per RoundTripper contract
	token.SetAuthHeader(req2)
	// req.Body is assumed to be closed by the base RoundTripper.
	reqBodyClosed = true
	return t.base.RoundTrip(req2)
}

// cloneRequest returns a clone of the provided *http.Request.
// The clone is a shallow copy of the struct and its Header map.
func cloneRequest(r *http.Request) *http.Request {
	// shallow copy of the struct
	r2 := new(http.Request)
	*r2 = *r
	// deep copy of the Header
	r2.Header = make(http.Header, len(r.Header))
	for k, s := range r.Header {
		r2.Header[k] = append([]string(nil), s...)
	}
	return r2
}
