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

package dev.perses.model.api.v1.common;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.math.BigInteger;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class DurationTest {

    @ParameterizedTest
    @MethodSource("durationToStringParameters")
    public void testDurationToString(long durationMillis, String expected) {
        Duration duration = new Duration(java.time.Duration.ofMillis(durationMillis));
        assertEquals(expected, duration.toString());
    }

    private static Stream<Arguments> durationToStringParameters() {
        return Stream.of(
                Arguments.of(Duration.YEAR, "1y"),
                Arguments.of(Duration.WEEK, "1w"),
                Arguments.of(Duration.DAY, "1d"),
                Arguments.of(Duration.HOUR, "1h"),
                Arguments.of(Duration.MINUTE, "1m"),
                Arguments.of(Duration.SECOND, "1s"),
                Arguments.of(1500L, "1s500ms"),
                Arguments.of(0L, "0s"),
                Arguments.of(Duration.WEEK + 3 * Duration.DAY + 45 * Duration.MINUTE + 2 * Duration.SECOND, "10d45m2s")
        );
    }

    @ParameterizedTest
    @MethodSource("durationParseParameters")
    public void testDurationParse(String s, long expectedMillis) {
        Duration duration = Duration.parse(s);
        assertEquals(expectedMillis, duration.getDuration().toMillis());
    }

    private static Stream<Arguments> durationParseParameters() {
        return Stream.of(
                Arguments.of("1y", Duration.YEAR),
                Arguments.of("1w", Duration.WEEK),
                Arguments.of("1d", Duration.DAY),
                Arguments.of("1h", Duration.HOUR),
                Arguments.of("1m", Duration.MINUTE),
                Arguments.of("1s", Duration.SECOND),
                Arguments.of("1s500ms", 1500L),
                Arguments.of("0s", 0L),
                Arguments.of("10d45m2s", Duration.WEEK + 3 * Duration.DAY + 45 * Duration.MINUTE + 2 * Duration.SECOND)
        );
    }

    @Test
    public void testParseInvalidOrderThrows() {
        assertThrows(IllegalArgumentException.class, () -> Duration.parse("5m3h"));
    }

    @Test
    public void testParseUnknownUnitThrows() {
        assertThrows(IllegalArgumentException.class, () -> Duration.parse("5x"));
    }

    @Test
    public void testParseEmptyAndNullThrows() {
        assertThrows(IllegalArgumentException.class, () -> Duration.parse(""));
        assertThrows(IllegalArgumentException.class, () -> Duration.parse(null));
    }

    @Test
    public void testParseNonDigitStartThrows() {
        assertThrows(IllegalArgumentException.class, () -> Duration.parse("ms"));
    }

    @Test
    public void testParseOverflowThrows() {
        // create a number greater than Long.MAX_VALUE and append ms to force overflow
        BigInteger tooLarge = BigInteger.valueOf(Long.MAX_VALUE).add(BigInteger.ONE);
        String s = tooLarge.toString() + "ms";
        assertThrows(IllegalArgumentException.class, () -> Duration.parse(s));
    }
}
