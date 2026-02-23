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

package utils

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/jmespath/go-jmespath"
	"github.com/labstack/echo/v4"
)

const CookieName = "persistedClaims"

func NewClaimsManager() ClaimsManager {
	return ClaimsManager{
		cookieName: CookieName,
	}
}

type Claims map[string]any

// ClaimsManager is a helper struct responsible for extracting extra claims from the provider JWT token
// and providing helper functions to persist these claims via cookies
type ClaimsManager struct {
	cookieName  string
	savedClaims []string
}

// SetCookie creates and adds the cookie with claims persisted from the provider token
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
func (cm *ClaimsManager) GetPersistentClaims(ctx echo.Context) Claims {
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

func (cm *ClaimsManager) decodeCookie(cookieValue string) Claims {
	// b64 decode cookie value
	decoded, err := base64.StdEncoding.DecodeString(cookieValue)
	if err != nil {
		return nil
	}

	// unmarshal decoded cookie value
	var data Claims
	err = json.Unmarshal(decoded, &data)
	if err != nil {
		return nil
	}

	return data
}

func (cm *ClaimsManager) lookupClaim(data any, key string) any {
	extractedData, err := jmespath.Search(key, data)
	if err != nil {
		return nil
	}
	return extractedData
}

// ExtractClaimsFromJWTPayload takes the jwtPayload cookie and extracts additional claims
// Assumes jwtPayloadCookie value containing only the Header and Payload section of the provider JWT token
// TODO: double check the structure of the jwtPayloadCookie (full token or just the header&payload part?)
// returns a map in a general format of map[<JMESPath to requested claim>]<requested claim>
func (cm *ClaimsManager) ExtractClaimsFromJWTPayload(jwtPayloadCookie *http.Cookie, wantedClaims []string) Claims {
	// check if there are only two parts of the JWT token; return nil otherwise
	cookieValue := strings.Split(jwtPayloadCookie.Value, ".")
	if len(cookieValue) != 2 {
		return nil
	}

	// decode & unmarshal cookie value
	decoded := cm.decodeCookie(cookieValue[1])
	if decoded == nil {
		return nil
	}

	// extract wanted claims from the decoded cookie
	extractedClaims := make(Claims)
	for _, key := range wantedClaims {
		c := cm.lookupClaim(decoded, key)
		if c != nil {
			extractedClaims[key] = c
		}
	}

	return extractedClaims
}
