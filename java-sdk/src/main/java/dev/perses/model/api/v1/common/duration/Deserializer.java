// Copyright 2025 The Perses Authors
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

package dev.perses.model.api.v1.common.duration;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;

/**
 * Jackson deserializer for dev.perses.model.api.v1.common.Duration.
 * Accepts a JSON string like "1h30m" (parsed via Duration.parse)
 * or a JSON number interpreted as milliseconds.
 */
public class Deserializer extends JsonDeserializer<Duration> {
    @Override
    public Duration deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonToken t = p.currentToken();
        if (t == JsonToken.VALUE_NULL) {
            return null;
        }
        if (t == JsonToken.VALUE_NUMBER_INT || t == JsonToken.VALUE_NUMBER_FLOAT) {
            long millis = p.getValueAsLong();
            return new Duration(java.time.Duration.ofMillis(millis));
        }
        // treat as string
        String text = p.getValueAsString();
        if (text == null) {
            return null;
        }
        // Delegate parsing to the existing Duration.parse method (throws IllegalArgumentException on bad input)
        return Duration.parse(text);
    }
}
