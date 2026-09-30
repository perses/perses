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
	"os"
	"strings"
	"sync"
	"time"

	secretModel "github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/sirupsen/logrus"
)

const (
	// transportMaxLifetime bounds how long a cached transport is reused.
	// Once expired, the transport is rebuilt on the next request. It guarantees that:
	//   - transports of deleted or unused datasources are eventually released,
	//   - a change of the CA file that is not detected by its fingerprint (see caFileFingerprint) is eventually picked up.
	transportMaxLifetime = 5 * time.Minute
	// transportSweepInterval is the minimum delay between two removals of the expired transports.
	transportSweepInterval = time.Minute
	// transportRebuildGracePeriod is how long the previous transport of a datasource is still used
	// when a new one cannot be built, for example, because the CA file is being rewritten.
	// After that, the error is returned to the caller.
	transportRebuildGracePeriod = time.Minute
	// transportRebuildRetryInterval is the minimum delay between two attempts to rebuild a transport after a failure.
	transportRebuildRetryInterval = 5 * time.Second
)

// transportKey builds the identity of a saved datasource used as a key in the transport cache.
// Each part is joined with a separator that is not allowed in Perses resource names (nor in a path parameter).
// Note: even in case of a key collision, a transport is only reused if it has been built from the same settings (see transportSettings),
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

// fileFingerprint identifies a version of a file on disk without reading it.
type fileFingerprint struct {
	modTime int64
	size    int64
}

// caFileFingerprint returns the fingerprint of the CA file referenced by the TLS config, if any.
// Only the CA file is considered: it is read once when the TLS config is built,
// whereas the client certificate and key files are read again at each TLS handshake (see prometheus/common NewTLSConfig).
// ok is false when the file cannot be stat'ed (e.g. while it is being replaced). The cached transport is then considered up to date.
func caFileFingerprint(tlsConfig *secretModel.TLSConfig) (fingerprint fileFingerprint, ok bool) {
	if tlsConfig == nil || len(tlsConfig.CAFile) == 0 {
		return fileFingerprint{}, true
	}
	// os.Stat (and not os.Lstat) follows the symlinks. It is required to detect the rotation of the Kubernetes secrets / configmaps
	// mounted as volume, where the file is a symlink to a "..data" symlink that is swapped to a new directory on update.
	info, err := os.Stat(tlsConfig.CAFile)
	if err != nil {
		return fileFingerprint{}, false
	}
	return fileFingerprint{modTime: info.ModTime().UnixNano(), size: info.Size()}, true
}

type transportEntry struct {
	// configHash is the hash of the settings the transport has been built from (see transportSettings).
	configHash [sha256.Size]byte
	// caFile is the fingerprint of the CA file when the transport has been built.
	caFile    fileFingerprint
	transport *http.Transport
	expiresAt time.Time
	// failedSince is set when the transport needed to be rebuilt, but the rebuild failed.
	failedSince time.Time
	// retryAt is the earliest time a new rebuild is attempted after a failure.
	retryAt time.Time
}

// transportCache keeps one *http.Transport per saved datasource, so connections (TCP + TLS) to the datasource
// are reused across requests instead of being re-established for every proxied request.
//
// An entry is identified by the datasource identity. The transport is rebuilt when:
//   - the settings of the transport change (see transportSettings), like the TLS config of the secret or the connection timeout
//     (detected with a hash of the settings. Only the hash is kept in memory, never the TLS config itself),
//   - the CA file referenced by the TLS config changes on disk (detected with its modification time and size),
//   - the transport expires (see transportMaxLifetime).
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

// transportSettings gathers the settings of a datasource that a transport is built from.
// A cached transport is only reused if it has been built from the same settings.
type transportSettings struct {
	// TLSConfig is the TLS config of the datasource secret. It can be nil.
	TLSConfig *secretModel.TLSConfig `json:"tlsConfig"`
	// ConnectTimeout is the maximum amount of time allowed to establish a connection to the datasource.
	ConnectTimeout time.Duration `json:"connectTimeout"`
}

func hashSettings(settings transportSettings) ([sha256.Size]byte, error) {
	// json.Marshal is deterministic for structs, and TLSConfig doesn't use any redacted type,
	// so any change in the settings (including inline certificates and keys) changes the hash.
	data, err := json.Marshal(settings)
	if err != nil {
		return [sha256.Size]byte{}, err
	}
	return sha256.Sum256(data), nil
}

// get returns the transport cached for the given key if it is still up to date.
// Otherwise, it builds a new one with the given function, caches it and returns it.
func (c *transportCache) get(key string, settings transportSettings, build func() (*http.Transport, error)) (*http.Transport, error) {
	configHash, err := hashSettings(settings)
	if err != nil {
		return nil, err
	}
	// The CA file must be stat'ed before building the transport. If the file changes in between,
	// the stored fingerprint is the old one, and the next request rebuilds the transport again.
	// The other way around, a new fingerprint could be stored with the old content, and the change would be missed.
	caFile, caFileKnown := caFileFingerprint(settings.TLSConfig)
	if t := c.lookup(key, configHash, caFile, caFileKnown); t != nil {
		return t, nil
	}
	// Build outside the lock: building the TLS config may read files from the disk,
	// and it must not block the requests targeting the other datasources.
	t, err := build()
	if err != nil {
		if previous := c.fallback(key, configHash); previous != nil {
			logrus.WithError(err).WithField("transport", key).Warning("unable to rebuild the transport of the datasource, the previous one is still used")
			return previous, nil
		}
		return nil, err
	}
	return c.store(key, configHash, caFile, t), nil
}

// lookup returns the cached transport to use, or nil if a new transport must be built.
func (c *transportCache) lookup(key string, configHash [sha256.Size]byte, caFile fileFingerprint, caFileKnown bool) *http.Transport {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	now := c.now()
	c.sweepLocked(now)
	e, ok := c.entries[key]
	if !ok || e.configHash != configHash {
		return nil
	}
	// The cached transport is up to date and can be reused when both conditions are met:
	//   - it has not expired (see transportMaxLifetime),
	//   - the CA file didn't change on disk since the transport has been built. When the CA file cannot be stat'ed (caFileKnown is false),
	//     it is considered unchanged: the file is likely being replaced (e.g. missing for a short time), and rebuilding the transport would fail anyway
	//     since the file cannot be read. The next request will stat it again.
	//     Note that when the TLS config doesn't reference any CA file, both fingerprints are empty and so always equal.
	if now.Before(e.expiresAt) && (!caFileKnown || e.caFile == caFile) {
		return e.transport
	}
	// At this point, the transport must be rebuilt. However, if a previous rebuild failed (see fallback),
	// the current transport is still used without trying to rebuild it again, as long as:
	//   - failedSince is set: a previous rebuild of this transport failed. It is reset when a new transport is successfully stored.
	//   - now is before retryAt: the retry interval (transportRebuildRetryInterval) is not over. It avoids reading and parsing the CA file,
	//     and logging a warning, for every request while the file is invalid.
	//   - the grace period (transportRebuildGracePeriod) that started with the first failure is not over. After that, the previous transport
	//     is not used anymore, so a CA file that cannot be read is not trusted forever.
	// Otherwise, nil is returned and the caller tries to rebuild the transport.
	// If it fails again, fallback decides whether the previous transport can still be used, or whether the error must be returned.
	if !e.failedSince.IsZero() && now.Before(e.retryAt) && now.Sub(e.failedSince) < transportRebuildGracePeriod {
		return e.transport
	}
	return nil
}

// fallback returns the current transport of the datasource when a new one cannot be built, as long as:
//   - the settings didn't change (only the CA file changed on disk, or the transport expired),
//   - the first failure happened less than transportRebuildGracePeriod ago.
//
// It avoids failing the requests while the CA file is being rewritten, without trusting forever a CA that cannot be read anymore.
func (c *transportCache) fallback(key string, configHash [sha256.Size]byte) *http.Transport {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	now := c.now()
	e, ok := c.entries[key]
	if !ok || e.configHash != configHash {
		return nil
	}
	if e.failedSince.IsZero() {
		e.failedSince = now
	}
	// The grace period is over: the rebuild has kept failing since the first failure (failedSince, set only once above),
	// for more than transportRebuildGracePeriod. It is no longer a transient error, like a CA file being rewritten,
	// but the new config is likely invalid (e.g. the CA file has been removed or replaced by an invalid one).
	// The previous transport is not used anymore, so a CA that cannot be read anymore is not trusted forever,
	// and the build error is returned to the caller, like it would have been without the cache.
	// failedSince is not reset and retryAt is not updated: every next request tries to rebuild the transport (see lookup),
	// and as soon as it succeeds, the new transport is stored with a clean state (see store).
	if now.Sub(e.failedSince) >= transportRebuildGracePeriod {
		return nil
	}
	e.retryAt = now.Add(transportRebuildRetryInterval)
	return e.transport
}

func (c *transportCache) store(key string, configHash [sha256.Size]byte, caFile fileFingerprint, t *http.Transport) *http.Transport {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	now := c.now()
	if e, ok := c.entries[key]; ok {
		if e.configHash == configHash && e.caFile == caFile && e.failedSince.IsZero() && now.Before(e.expiresAt) {
			// Another request built the same transport concurrently. Keep the cached one and drop ours.
			t.CloseIdleConnections()
			return e.transport
		}
		// The transport is being replaced: release the idle connections of the previous one.
		// Connections still in use by in-flight requests are not affected.
		e.transport.CloseIdleConnections()
	}
	c.entries[key] = &transportEntry{
		configHash: configHash,
		caFile:     caFile,
		transport:  t,
		expiresAt:  now.Add(c.lifetime),
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
