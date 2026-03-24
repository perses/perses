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
	"strings"
	"sync"
	"time"

	"github.com/jmespath/go-jmespath"
	"github.com/sirupsen/logrus"
)

const CookieName = "persistedClaims"

// claims cache
type entryValue struct {
	cookie string
	claims map[string]any
}

type entry struct {
	value  entryValue
	expiry time.Time
}

func (e entry) isExpired() bool {
	return time.Now().After(e.expiry)
}

type Cache struct {
	// items is a map where the key is the username, and entry values are the cookie and claims
	// when a new session is created / cookie is refreshed, cache entry is redone
	items map[string]entry
	mu    sync.Mutex
	ttl   time.Duration
}

func CreateCache() *Cache {
	c := &Cache{
		items: map[string]entry{},
		ttl:   10 * time.Minute,
	}

	go func() {
		for range time.Tick(10 * time.Second) {
			c.mu.Lock()

			for username, entry := range c.items {
				if entry.isExpired() {
					delete(c.items, username)
				}
			}
			c.mu.Unlock()
		}
	}()

	return c
}

func (c *Cache) Set(username string, ttl time.Duration, value entryValue) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[username] = entry{
		value:  value,
		expiry: time.Now().Add(ttl),
	}
}

func (c *Cache) Get(username string) (entryValue, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()

	item, found := c.items[username]
	if !found {
		return item.value, false
	}

	if item.isExpired() {
		delete(c.items, username)
		return item.value, false
	}

	return item.value, true
}

func (c *Cache) Remove(username string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.items, username)
}

// returns a new ClaimsManager
// precompiles JMESPath queries for later use
func NewClaimsManager(persistClaims []string) ClaimsManager {
	cm := ClaimsManager{
		cache:         CreateCache(),
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
	cache         *Cache
	PersistClaims []JMESPathQuery
}

type JMESPathQuery struct {
	path  string
	query *jmespath.JMESPath
}

// Stores claims in cache; if an entry with the same cookie and username exists, is omitted
// returns true if cache entry set, otherwise false (not sure if useful?)
func (cm *ClaimsManager) SetClaims(username string, cookie string, ttl time.Duration, data Claims) bool {
	// check if username exists in cache or is cookie updated
	values, ok := cm.cache.Get(username)
	// add / update entry
	if !ok || values.cookie != cookie {
		newValues := entryValue{
			cookie: cookie,
			claims: data,
		}
		cm.cache.Set(username, ttl, newValues)
		return true
	}

	return false
}

func (cm *ClaimsManager) GetClaims(username string) Claims {
	values, ok := cm.cache.Get(username)
	if !ok {
		return Claims{}
	}
	return values.claims
}

func (cm *ClaimsManager) decodeCookie(cookieValue string) interface{} {
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

func (cm *ClaimsManager) lookupClaim(data interface{}, query *jmespath.JMESPath) (any, error) {
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

	return extractedClaims
}
