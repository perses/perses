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

package auth

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

var persistClaims = []string{
	"test_claim_1",
	"test_claim_5",
	"test_claim_6.embeded_claim_key",
}

func TestDecodeCookie(t *testing.T) {
	type testCase struct {
		data           string
		expectedResult any
	}

	// populate test cases
	tc := []testCase{
		// invalid encoding
		{
			data:           "dGVzdF90b2tlbgo",
			expectedResult: nil,
		},
		{
			data:           "dGVzdF90b2tlbgo@",
			expectedResult: nil,
		},
		// unable to unmarshal into Claims
		{
			data:           "dGVzdF90b2tlbgo=",
			expectedResult: nil,
		},
		// valid
		{
			data:           "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0",
			expectedResult: map[string]interface{}{"admin": true, "iat": 1.516239022e+09, "name": "John Doe", "sub": "1234567890"},
		},
	}

	// create ClaimsManager
	cm := NewClaimsManager(persistClaims)

	for _, c := range tc {
		output := cm.decodeCookie(c.data)
		if c.expectedResult == nil {
			assert.Nil(t, output)
		} else {
			assert.Equal(t, c.expectedResult, output)
		}
	}
}

func TestExtractClaimsFromJWTPayload(t *testing.T) {
	type testCase struct {
		accessToken    string
		expectedResult any
	}

	// populate test cases
	// for all intents and purposes, Claims(nil) == nil => true; it's only assert.Equal that fails the test
	tc := []testCase{
		// too many parts in token
		{
			accessToken:    "xyz.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZXN0X2NsYWltXzUiOiJ0ZXN0X2NsYWltXzVfdmFsdWUiLCJ0ZXN0X2NsYWltXzYiOiJ0ZXN0X2NsYWltXzZfdmFsdWUiLCJ0ZXN0X2NsYWltXzciOmZhbHNlfQ.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30",
			expectedResult: Claims(nil),
		},
		// undecoded token
		{
			accessToken:    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZXN0X2NsYWltXz#UiOiJ0ZXN0X2NsYWltXzVfdmFsdWUiLCJ0ZXN0X2NsYWltXzYiOiJ0ZXN0X2NsYWltXzZfdmFsdWUiLCJ0ZXN0X2NsYWltXzciOmZhbHNlfQ.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30",
			expectedResult: Claims(nil),
		},
		// cannot unmarshal into Claims
		{
			accessToken:    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.InN0cmluZyI.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30",
			expectedResult: Claims(nil),
		},
		// valid token, no claims found - empty Claims
		{
			accessToken:    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30",
			expectedResult: Claims(nil),
		},
		// valid token, extracted claims
		{
			accessToken:    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZXN0X2NsYWltXzEiOiJ0ZXN0X2NsYWltXzFfdmFsdWUiLCJ0ZXN0X2NsYWltXzIiOiJ0ZXN0X2NsYWltXzJfdmFsdWUiLCJ0ZXN0X2NsYWltXzQiOmZhbHNlfQ.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30",
			expectedResult: Claims{"test_claim_1": "test_claim_1_value"},
		},
		{
			accessToken: "abc.ewoJInRlc3RfY2xhaW1fMSI6ICJ0ZXN0X2NsYWltXzFfdmFsdWUiLAoJInRlc3RfY2xhaW1fMiI6ICJ0ZXN0X2NsYWltXzJfdmFsdWUiLAoJInRlc3RfY2xhaW1fMyI6ICJ0ZXN0X2NsYWltXzNfdmFsdWUiLAoJInRlc3RfY2xhaW1fNCI6IHsKCQkiZW1iZWRlZF9jbGFpbV80XzEiOiAiZW1iZWRlZF9jbGFpbV80XzFfdmFsdWUiLAoJCSJlbWJlZGVkX2NsYWltXzRfMiI6ICJlbWJlZGVkX2NsYWltXzRfMl92YWx1ZSIsCgkJImVtYmVkZWRfY2xhaW1fNF8zIjogImVtYmVkZWRfY2xhaW1fNF8zX3ZhbHVlIgoJfSwKCSJ0ZXN0X2NsYWltXzUiOiBbCgkJImVtYmVkZWRfY2xhaW1fNV8xIiwKCQkiZW1iZWRlZF9jbGFpbV81XzIiLAoJCSJlbWJlZGVkX2NsYWltXzVfMyIKCV0sCgkidGVzdF9jbGFpbV82IjogewoJCSJlbWJlZGVkX2NsYWltX2tleSI6ICJlbWJlZGVkX2NsYWltX3ZhbHVlIgoJfQp9.xyz",
			expectedResult: Claims{
				"test_claim_1": "test_claim_1_value",
				"test_claim_5": []interface{}{
					"embeded_claim_5_1",
					"embeded_claim_5_2",
					"embeded_claim_5_3",
				},
				"test_claim_6.embeded_claim_key": "embeded_claim_value"},
		},
	}

	// create ClaimsManager
	cm := NewClaimsManager(persistClaims)

	for _, c := range tc {
		output := cm.ExtractClaimsFromJWTPayload(c.accessToken)
		if c.expectedResult == nil {
			assert.Nil(t, output)
		} else {
			assert.Equal(t, c.expectedResult, output)
		}
	}
}
