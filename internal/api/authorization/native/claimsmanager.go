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

package native

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/jmespath/go-jmespath"
	"github.com/labstack/echo/v4"
	"github.com/sirupsen/logrus"
)

const CookieName = "persistedClaims"

// returns a new ClaimsManager
// precompiles JMESPath queries for later use
func NewClaimsManager(persistClaims []string) ClaimsManager {
	cm := ClaimsManager{
		cookieName:    CookieName,
		PersistClaims: []JMESPathQuery{},
	}
	for _, c := range persistClaims {
		precompiled, err := jmespath.Compile(c)
		if err != nil {
			logrus.Warningf("unable to precompile claim jmespath: %s", err.Error())
			continue
		}
		cm.PersistClaims = append(cm.PersistClaims, JMESPathQuery{
			path:  c,
			query: precompiled,
		})
	}
	return cm
}

type Claims map[string]any

// ClaimsManager is a helper struct responsible for extracting extra claims from the provider JWT token
// and providing helper functions to persist these claims via cookies
type ClaimsManager struct {
	cookieName    string
	PersistClaims []JMESPathQuery
}

type JMESPathQuery struct {
	path  string
	query *jmespath.JMESPath
}

// SetCookie creates and sets the cookie with claims persisted from the provider token;
// returns true if cookie was successfuly created and set; otherwise false
func (cm *ClaimsManager) SetCookie(ctx echo.Context, data Claims) bool {
	// marshal & encode data
	cookie := cm.createCookie(data)
	if cookie == nil {
		return false
	}

	// create cookie
	ctx.SetCookie(cookie)

	// returns ok if cookie was created successfully
	return true
}

func (cm *ClaimsManager) createCookie(data Claims) *http.Cookie {
	// marshal payload into json
	jsonPayload, err := json.Marshal(data)
	if err != nil {
		return nil
	}
	// b64 encode marshaled payload
	encodedPayload := base64.StdEncoding.EncodeToString([]byte(jsonPayload))
	return &http.Cookie{
		Name:  cm.cookieName,
		Value: encodedPayload,
	}
}

// GetPersistentClaims returns the claims persisted via the cookie
func (cm *ClaimsManager) GetPersistentClaims(ctx echo.Context) any {
	// get cookie
	cookie := cm.getCookie(ctx)
	if cookie == nil {
		return nil
	}

	// decode & unmarshal cookie
	data := cm.decodeCookie(cookie.Value)

	// returns Claims or nil; nil handled downstream
	return data
}

func (cm *ClaimsManager) getCookie(ctx echo.Context) *http.Cookie {
	cookie, err := ctx.Cookie(cm.cookieName)
	if err != nil {
		return nil
	}
	return cookie
}

func (_ *ClaimsManager) decodeCookie(cookieValue string) interface{} {
	// recreate padding
	if i := len(cookieValue) % 4; i != 0 {
		cookieValue += strings.Repeat("=", 4-i)
	}

	// b64 decode cookie value
	decoded, err := base64.StdEncoding.DecodeString(cookieValue)
	if err != nil {
		return nil
	}

	// unmarshal decoded cookie value
	var data interface{}
	err = json.Unmarshal(decoded, &data)
	if err != nil {
		return nil
	}

	return data
}

func (_ *ClaimsManager) lookupClaim(data interface{}, query *jmespath.JMESPath) (any, error) {
	extractedData, err := query.Search(data)
	if err != nil {
		return nil, err
	}
	return extractedData, nil
}

// ExtractClaimsFromJWTPayload takes the oidc/oAuth access token and extracts additional claims;
// returns a map in a general format of map[claim_name]<requested claim>
func (cm *ClaimsManager) ExtractClaimsFromJWTPayload(accessToken string) Claims {
	// check if the token is generally resembling a JWT token ; return nil otherwise
	tokenPayload := strings.Split(accessToken, ".")
	if len(tokenPayload) != 3 {
		return nil
	}

	// decode & unmarshal token payload
	decoded := cm.decodeCookie(tokenPayload[1])
	if decoded == nil {
		return nil
	}

	// extract wanted claims from the decoded token payload
	extractedClaims := make(Claims)
	for _, pc := range cm.PersistClaims {
		c, err := cm.lookupClaim(decoded, pc.query)
		if c == nil || err != nil {
			continue
		}
		extractedClaims[pc.path] = c
	}

	if len(extractedClaims) == 0 {
		return nil
	}

	return extractedClaims
}
