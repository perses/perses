// Code generated by cue get go. DO NOT EDIT.

//cue:generate cue get go github.com/perses/perses/pkg/model/api/v1/secret

package secret

// PublicTLSConfig is the public struct of TLSConfig.
// It's used when the API returns a response to a request
#PublicTLSConfig: {
	ca?:                 #Hidden @go(CA)
	cert?:               #Hidden @go(Cert)
	key?:                #Hidden @go(Key)
	caFile?:             string  @go(CAFile)
	certFile?:           string  @go(CertFile)
	keyFile?:            string  @go(KeyFile)
	serverName?:         string  @go(ServerName)
	insecureSkipVerify?: bool    @go(InsecureSkipVerify)
	minVersion?:         string  @go(MinVersion)
	maxVersion?:         string  @go(MaxVersion)
}

#TLSConfig: {
	// Text of the CA cert to use for the targets.
	ca?: string @go(CA)

	// Text of the client cert file for the targets.
	cert?: string @go(Cert)

	// Text of the client key file for the targets.
	key?: string @go(Key)

	// The CA cert to use for the targets.
	caFile?: string @go(CAFile)

	// The client cert file for the targets.
	certFile?: string @go(CertFile)

	// The client key file for the targets.
	keyFile?: string @go(KeyFile)

	// Used to verify the hostname for the targets.
	serverName?: string @go(ServerName)

	// Disable target certificate validation.
	insecureSkipVerify?: bool @go(InsecureSkipVerify)

	// Minimum acceptable TLS version. Accepted values: TLS10 (TLS 1.0), TLS11 (TLS 1.1), TLS12 (TLS 1.2), TLS13 (TLS 1.3).
	// If unset, Perses will use Go default minimum version, which is TLS 1.2.
	// See MinVersion in https://pkg.go.dev/crypto/tls#Config.
	minVersion?: string @go(MinVersion)

	// Maximum acceptable TLS version. Accepted values: TLS10 (TLS 1.0), TLS11 (TLS 1.1), TLS12 (TLS 1.2), TLS13 (TLS 1.3).
	// If unset, Perses will use Go default maximum version, which is TLS 1.3.
	// See MaxVersion in https://pkg.go.dev/crypto/tls#Config.
	maxVersion?: string @go(MaxVersion)
}
