// Copyright 2023 The Perses Authors
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

package e2eframework

// This file is a copy paste of the internal/testutil of zitalde/oidc library
// It helps setting up required data for testing, such as tokens, claims and verifiers.

import (
	"context"
	"encoding/json"
	"time"

	"github.com/go-jose/go-jose/v4"
	"github.com/zitadel/oidc/v3/pkg/oidc"
)

// KeySet implements oidc.Keys
type KeySet struct{}

// VerifySignature implments op.KeySet.
func (KeySet) VerifySignature(ctx context.Context, jws *jose.JSONWebSignature) (payload []byte, err error) {
	if err = ctx.Err(); err != nil {
		return nil, err
	}

	return jws.Verify(WebKey.Public())
}

// use a reproducible signing key
const webkeyJSON = `
{
   "kty": "RSA",
   "kid": "KQ2tAcrE7lBaVVGBmc5FobgdJo4",
   "alg": "PS512",
   "n": "x6JoG8t2Li68JSwPwnh51TvHYFf3z72tQ3wmJG3VosU6MdJF0gSTCIwflOJ38OWE6hYtN1WAeyBy2CYdnXd1QZzkK_apGK4M7hsNA9jCTg8NOZjLPL0ww1jp7313Skla7mbm90uNdg4TUNp2n_r-sCYywI-9cfSlhzLSksxKK_BRdzy6xW20daAcI-mErQXIcvdYIguunJk_uTb8kJedsWMcQ4Mb57QujUok2Z2YabWyb9Fi1_StixXJvd_WEu93SHNMORB0u6ymnO3aZJdATLdhtcP-qsVicQhffpqVazmZQPf7K-7n4I5vJE4g9XXzZ2dSKSp3Ewe_nna_2kvbCw",
   "e": "AQAB",
   "d": "sl3F_QeF2O-CxQegMRYpbL6Tfd47GM6VDxXOkn_cACmNvFPudB4ILPvdf830cjTv06Lq1WS8fcZZNgygK0A_cNc3-pvRK67e-KMMtuIlgU7rdwmwlN1Iw1Ee-w6z1ZjC-PzR4iQMCW28DmKS2I-OnV4TvH7xOe7nMmvTPrvujV__YKfUxvAWXJG7_wtaJBGplezn5nNsKG2Ot9h0mhMdYUgGC36wLxo3Q5d4m79EXQYdhm89EfxogwvMmHRes5PNpHRuDZRHGAI4RZi2KvgmqF07e1Qdq4TqbQnY5pCYrdjqvEFFjGC6jTE-ak_b21FcSVy-9aZHyf04U4g5-cIUEQ",
   "p": "7AaicFryJCHRekdSkx8tfPxaSiyEuN8jhP9cLqs4rLkIbrSHmanPhjnLe-Tlh3icQ8hPoy6WC8ktLwsrzbfGIh4U_zgAfvtD1Y_lZM-YSWZsxqlrGiI5do11iVzzoy4a1XdkgOjHQz9y6J-uoA9jY8ILG7VaEZQnaYwWZV3cspk",
   "q": "2Ide9hlwthXJQJYqI0mibM5BiGBxJ4CafPmF1DYNXggBCczZ6ERGReNTGM_AEhy5mvLXUH6uBSOJlfHTYzx49C1GgIO3hEWVEGAKAytVRL6RfAkVSOXMQUp-HjXKpGg_Nx1SJxQf3rulbW8HXO4KqIlloyIXpPQSK7jB8A4hJUM",
   "dp": "1nmc6F4sRNsaQHRJO_mL21RxM4_KtzfFThjCCoJ6iLHHUNnpkp_1PTKNjrLMRFM8JHgErfMqU-FmlqYfEtvZRq1xRQ39nWX0GT-eIwJljuVtGQVglqnc77bRxJXbqz-9EJdik6VzVM92Op7IDxiMp1zvvSkJhInNWqL6wvgNEZk",
   "dq": "dlHizlAwiw90ndpwxD-khhhfLwqkSpW31br0KnYu78cn6hcKrCVC0UXbTp-XsU4JDmbMyauvpBc7Q7iVbpDI94UWFXvkeF8diYkxb3HqclpAXasI-oC4EKWILTHvvc9JW_Clx7zzfV7Ekvws5dcd8-LAq1gh232TwFiBgY_3BMk",
   "qi": "E1k_9W3odXgcmIP2PCJztE7hB7jeuAL1ElAY88VJBBPY670uwOEjKL2VfQuz9q9IjzLAvcgf7vS9blw2RHP_XqHqSOlJWGwvMQTF0Q8zLknCgKt8q7HQQNWIJcBZ8qdUVn02-qf4E3tgZ3JHaHNs8imA_L-__WoUmzC4z5jH_lM"
}`
const SignatureAlgorithm = jose.RS256

var (
	WebKey jose.JSONWebKey
	Signer jose.Signer
)

func init() {
	err := json.Unmarshal([]byte(webkeyJSON), &WebKey)
	if err != nil {
		panic(err)
	}
	Signer, err = jose.NewSigner(jose.SigningKey{Algorithm: SignatureAlgorithm, Key: WebKey}, nil)
	if err != nil {
		panic(err)
	}
}

func signEncodeTokenClaims(claims any) string {
	payload, err := json.Marshal(claims)
	if err != nil {
		panic(err)
	}
	object, err := Signer.Sign(payload)
	if err != nil {
		panic(err)
	}
	token, err := object.CompactSerialize()
	if err != nil {
		panic(err)
	}
	return token
}

func claimsMap(claims any) map[string]any {
	data, err := json.Marshal(claims)
	if err != nil {
		panic(err)
	}
	dst := make(map[string]any)
	if err = json.Unmarshal(data, &dst); err != nil {
		panic(err)
	}
	return dst
}

func NewIDTokenCustom(issuer, subject string, audience []string, expiration, authTime time.Time, nonce string, acr string, amr []string, clientID string, skew time.Duration, atHash string, custom map[string]any) (string, *oidc.IDTokenClaims) {
	claims := oidc.NewIDTokenClaims(issuer, subject, audience, expiration, authTime, nonce, acr, amr, clientID, skew)
	claims.AccessTokenHash = atHash
	claims.Claims = custom
	token := signEncodeTokenClaims(claims)

	// set this so that assertion in tests will work
	claims.SignatureAlg = SignatureAlgorithm
	claims.Claims = claimsMap(claims)
	return token, claims
}

// NewIDToken creates a new IDTokenClaims with passed data and returns a signed token and claims.
func NewIDToken(issuer, subject string, audience []string, expiration, authTime time.Time, nonce string, acr string, amr []string, clientID string, skew time.Duration, atHash string) (string, *oidc.IDTokenClaims) {
	return NewIDTokenCustom(issuer, subject, audience, expiration, authTime, nonce, acr, amr, clientID, skew, atHash, nil)
}

func NewAccessTokenCustom(issuer, subject string, audience []string, expiration time.Time, jwtid, clientID string, skew time.Duration, custom map[string]any) (string, *oidc.AccessTokenClaims) {
	claims := oidc.NewAccessTokenClaims(issuer, subject, audience, expiration, jwtid, clientID, skew)
	claims.Claims = custom
	token := signEncodeTokenClaims(claims)

	// set this so that assertion in tests will work
	claims.SignatureAlg = SignatureAlgorithm
	claims.Claims = claimsMap(claims)
	return token, claims
}

// NewAccessToken creates a new AccessTokenClaims with passed data and returns a signed token and claims.
func NewAccessToken(issuer, subject string, audience []string, expiration time.Time, jwtid, clientID string, skew time.Duration) (string, *oidc.AccessTokenClaims) {
	return NewAccessTokenCustom(issuer, subject, audience, expiration, jwtid, clientID, skew, nil)
}

// These variables always result in a valid token
var (
	ValidSubject    = "john.doeOIDC"
	ValidAudience   = []string{"unit", "test", "clientID"}
	ValidAuthTime   = time.Now().Add(-time.Minute)       // authtime is always 1 minute in the past
	ValidExpiration = ValidAuthTime.Add(2 * time.Minute) // token is always 1 more minute available
	ValidJWTID      = "9876"
	ValidNonce      = ""
	ValidACR        = "something"
	ValidAMR        = []string{"foo", "bar"}
	ValidClientID   = "clientID"
	ValidSkew       = time.Second
)

// ValidIDToken returns a token and claims that are in the token.
// It uses the Valid* global variables and the token will always
// pass verification.
func ValidIDToken(issuer string) (string, *oidc.IDTokenClaims) {
	return NewIDToken(issuer, ValidSubject, ValidAudience, ValidExpiration, ValidAuthTime, ValidNonce, ValidACR, ValidAMR, ValidClientID, ValidSkew, "")
}

// ValidAccessToken returns a token and claims that are in the token.
// It uses the Valid* global variables and the token always passes
// verification within the same test run.
func ValidAccessToken(issuer string) (string, *oidc.AccessTokenClaims) {
	return NewAccessToken(issuer, ValidSubject, ValidAudience, ValidExpiration, ValidJWTID, ValidClientID, ValidSkew)
}
