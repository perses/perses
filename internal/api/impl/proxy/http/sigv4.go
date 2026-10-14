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

package httpproxy

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"net/http"

	apiinterface "github.com/perses/perses/internal/api/interface"
	secretModel "github.com/perses/perses/pkg/model/api/v1/secret"
	promConfig "github.com/prometheus/common/config"
	"github.com/prometheus/sigv4"
)

const serverIdentityDeniedMsg = "signing the requests with the AWS identity of the Perses server is not allowed by its configuration ('datasource.proxy.http.sigv4.allow_default_credentials'); set an access key in the sigv4 secret"

// signer is the SigV4 round tripper built for a transport, cached with it (see TransportCache.getSigner).
type signer struct {
	// configHash is the hash of the SigV4 config the round tripper has been built from (see hashSigV4).
	configHash [sha256.Size]byte
	// base is the transport the round tripper sends the signed requests with.
	base         *http.Transport
	roundTripper http.RoundTripper
}

// hashSigV4 returns the hash of the SigV4 config, including the secret key, so a change of the secret rebuilds the signer.
// Only the hash is kept in memory, never the secret key itself.
func hashSigV4(cfg *secretModel.SigV4, secretKey string) ([sha256.Size]byte, error) {
	data, err := json.Marshal(struct {
		Config    *secretModel.SigV4 `json:"config"`
		SecretKey string             `json:"secretKey"`
	}{Config: cfg, SecretKey: secretKey})
	if err != nil {
		return [sha256.Size]byte{}, err
	}
	return sha256.Sum256(data), nil
}

// getRoundTripper returns the round tripper forwarding the requests to the datasource:
// the transport of the datasource (see getTransport), wrapped by a SigV4 signer when the secret defines one.
func (h *Proxy) getRoundTripper(ctx context.Context) (http.RoundTripper, error) {
	transport, err := h.getTransport()
	if err != nil {
		return nil, err
	}
	if h.Secret == nil || h.Secret.SigV4 == nil {
		return transport, nil
	}
	cfg := h.Secret.SigV4
	if !cfg.UsesStaticCredentials() && !h.ProxyConfig.SigV4.AllowDefaultCredentials {
		h.logPolicyEvent(h.logWithDefaultEntry(), "the sigv4 secret of the datasource has no access key, and the default credentials are not allowed")
		return nil, apiinterface.HandleForbiddenError(serverIdentityDeniedMsg)
	}
	secretKey, err := cfg.GetSecretKey()
	if err != nil {
		return nil, err
	}
	build := func() (http.RoundTripper, error) {
		return newSigV4RoundTripper(ctx, cfg, secretKey, transport)
	}
	if h.Transports == nil || len(h.TransportKey) == 0 {
		// Unsaved datasource: like its transport, the signer is not cached.
		return build()
	}
	configHash, err := hashSigV4(cfg, secretKey)
	if err != nil {
		return nil, err
	}
	return h.Transports.getSigner(h.TransportKey, configHash, transport, build)
}

// newSigV4RoundTripper builds the round tripper signing the requests sent with the given transport.
// It retrieves the AWS credentials (and assumes the role), so it must not be built for every request of a saved datasource.
func newSigV4RoundTripper(ctx context.Context, cfg *secretModel.SigV4, secretKey string, transport http.RoundTripper) (http.RoundTripper, error) {
	sigV4Config := &sigv4.SigV4Config{
		Region:      cfg.Region,
		AccessKey:   cfg.AccessKey,
		SecretKey:   promConfig.Secret(secretKey),
		RoleARN:     cfg.RoleARN,
		ExternalID:  cfg.ExternalID,
		ServiceName: cfg.ServiceName,
	}
	if err := sigV4Config.Validate(); err != nil {
		return nil, err
	}
	return sigv4.NewSigV4RoundTripper(sigV4Config, transport, sigv4.WithContext(ctx))
}
