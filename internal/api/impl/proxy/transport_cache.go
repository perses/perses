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

package proxy

import (
	"crypto/sha256"
	"encoding/json"
	"net/http"
	"strings"
	"sync"
	"time"

	secretModel "github.com/perses/perses/pkg/model/api/v1/secret"
)

const (
	// transportMaxLifetime bounds how long a cached transport is reused.
	// Once expired, the transport is rebuilt on the next request. It guarantees that:
	//   - transports of deleted or unused datasources are eventually released,
	//   - files referenced by the TLS config of the secret (caFile, certFile, keyFile) are periodically re-read,
	//     so a certificate rotation on disk is picked up without restarting Perses.
	transportMaxLifetime = 5 * time.Minute
	// transportSweepInterval is the minimum delay between two removals of the expired transports.
	transportSweepInterval = time.Minute
)

// transportKey builds the identity of a saved datasource used as a key in the transport cache.
// Each part is joined with a separator that is not allowed in Perses resource names (nor in a path parameter).
// Note: even in case of a key collision, a transport is only reused if it has been built from the same TLS config,
// meaning both transports would be strictly equivalent.
func transportKey(parts ...string) string {
	return strings.Join(parts, "/")
}

func globalTransportKey(datasourceName string) string {
	return transportKey("global", datasourceName)
}

func projectTransportKey(projectName, datasourceName string) string {
	return transportKey("project", projectName, datasourceName)
}

func dashboardTransportKey(projectName, dashboardName, datasourceName string) string {
	return transportKey("dashboard", projectName, dashboardName, datasourceName)
}

type transportEntry struct {
	hash      [sha256.Size]byte
	transport *http.Transport
	expiresAt time.Time
}

// transportCache keeps one *http.Transport per saved datasource, so connections (TCP + TLS) to the datasource
// are reused across requests instead of being re-established for every proxied request.
//
// An entry is identified by the datasource identity and by a hash of the TLS config it has been built from.
// When the TLS config of the secret changes, the hash changes and the transport is rebuilt.
// Only the hash is kept in memory, never the TLS config itself.
type transportCache struct {
	mutex     sync.Mutex
	entries   map[string]*transportEntry
	lifetime  time.Duration
	lastSweep time.Time
	// now is overridable for testing purpose.
	now func() time.Time
}

func newTransportCache() *transportCache {
	return &transportCache{
		entries:  make(map[string]*transportEntry),
		lifetime: transportMaxLifetime,
		now:      time.Now,
	}
}

func hashTLSConfig(tlsConfig *secretModel.TLSConfig) ([sha256.Size]byte, error) {
	// json.Marshal is deterministic for structs, and TLSConfig doesn't use any redacted type,
	// so any change in the config (including inline certificates and keys) changes the hash.
	data, err := json.Marshal(tlsConfig)
	if err != nil {
		return [sha256.Size]byte{}, err
	}
	return sha256.Sum256(data), nil
}

// get returns the transport cached for the given key if it has been built from the same TLS config and is not expired.
// Otherwise, it builds a new one with the given function, caches it and returns it.
func (c *transportCache) get(key string, tlsConfig *secretModel.TLSConfig, build func() (*http.Transport, error)) (*http.Transport, error) {
	hash, err := hashTLSConfig(tlsConfig)
	if err != nil {
		return nil, err
	}
	if t := c.lookup(key, hash); t != nil {
		return t, nil
	}
	// Build outside the lock: building the TLS config may read files from the disk,
	// and it must not block the requests targeting the other datasources.
	t, err := build()
	if err != nil {
		return nil, err
	}
	return c.store(key, hash, t), nil
}

func (c *transportCache) lookup(key string, hash [sha256.Size]byte) *http.Transport {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	now := c.now()
	c.sweepLocked(now)
	if e, ok := c.entries[key]; ok && e.hash == hash && now.Before(e.expiresAt) {
		return e.transport
	}
	return nil
}

func (c *transportCache) store(key string, hash [sha256.Size]byte, t *http.Transport) *http.Transport {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	now := c.now()
	if e, ok := c.entries[key]; ok {
		if e.hash == hash && now.Before(e.expiresAt) {
			// Another request built the same transport concurrently. Keep the cached one and drop ours.
			t.CloseIdleConnections()
			return e.transport
		}
		// The config changed or the entry expired: release the idle connections of the previous transport.
		// Connections still in use by in-flight requests are not affected.
		e.transport.CloseIdleConnections()
	}
	c.entries[key] = &transportEntry{
		hash:      hash,
		transport: t,
		expiresAt: now.Add(c.lifetime),
	}
	return t
}

// sweepLocked removes the expired entries. It must be called with the lock held.
// Sweeping lazily (while serving a request) avoids managing a background goroutine.
// Transports of datasources that are no longer queried stay in memory until the next sweep,
// but their idle connections are closed anyway by the transport itself after IdleConnTimeout.
func (c *transportCache) sweepLocked(now time.Time) {
	if now.Sub(c.lastSweep) < transportSweepInterval {
		return
	}
	c.lastSweep = now
	for key, e := range c.entries {
		if !now.Before(e.expiresAt) {
			e.transport.CloseIdleConnections()
			delete(c.entries, key)
		}
	}
}
