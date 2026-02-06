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

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;

import java.math.BigInteger;
import java.util.Map;

@JsonDeserialize(using = Deserializer.class)
@JsonSerialize(using = Serializer.class)
public record Duration(java.time.Duration internalDuration) {
    public final static long YEAR = 365L * 24 * 60 * 60 * 1000;
    public final static long WEEK = 7L * 24 * 60 * 60 * 1000;
    public final static long DAY = 24L * 60 * 60 * 1000;
    public final static long HOUR = 60L * 60 * 1000;
    public final static long MINUTE = 60L * 1000;
    public final static long SECOND = 1000L;

    private record Unit(int pos, long multMillis) {
    }

    private static final Map<String, Unit> UNITS = Map.of(
            "y", new Unit(1, YEAR),
            "w", new Unit(2, WEEK),
            "d", new Unit(3, DAY),
            "h", new Unit(4, HOUR),
            "m", new Unit(5, MINUTE),
            "s", new Unit(6, SECOND),
            "ms", new Unit(7, 1)
    );

    /**
     * Parse parses a string into a time.Duration, assuming that a year
     * always has 365d, a week always has 7d, and a day always has 24h.
     * This implementation is inspired by Prometheus' duration parsing.
     * <p>
     * 3d5h30m10s = 3 days, 5 hours, 30 minutes and 10 seconds
     * Valid time units are "y" (year), "w" (week), "d" (day), "h" (hour),
     * "m" (minute), "s" (second), "ms" (millisecond).
     */
    public static Duration parse(String s) {
        if (s == null) {
            throw new IllegalArgumentException("empty duration string");
        }
        if (s.equals("0")) {
            return new Duration(java.time.Duration.ZERO);
        }
        if (s.isEmpty()) {
            throw new IllegalArgumentException("empty duration string");
        }

        final String orig = s;
        BigInteger totalMillis = BigInteger.ZERO;
        int lastUnitPos = 0;

        while (!s.isEmpty()) {
            if (!Character.isDigit(s.charAt(0))) {
                throw new IllegalArgumentException("not a valid duration string: \"" + orig + "\"");
            }
            int i = 0;
            while (i < s.length() && Character.isDigit(s.charAt(i))) i++;
            String numStr = s.substring(0, i);
            BigInteger v;
            try {
                v = new BigInteger(numStr);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("not a valid duration string: \"" + orig + "\"");
            }
            s = s.substring(i);
            // Consume unit (all non-digit chars until next digit)
            i = 0;
            while (i < s.length() && !Character.isDigit(s.charAt(i))) i++;
            if (i == 0) {
                throw new IllegalArgumentException("not a valid duration string: \"" + orig + "\"");
            }
            String u = s.substring(0, i);
            s = s.substring(i);

            Unit unit = UNITS.get(u);
            if (unit == null) {
                throw new IllegalArgumentException("unknown unit \"" + u + "\" in duration \"" + orig + "\"");
            }
            if (unit.pos <= lastUnitPos) {
                throw new IllegalArgumentException("not a valid duration string: \"" + orig + "\"");
            }
            lastUnitPos = unit.pos;

            BigInteger add = v.multiply(BigInteger.valueOf(unit.multMillis));
            if (add.compareTo(BigInteger.valueOf(Long.MAX_VALUE)) > 0) {
                throw new IllegalArgumentException("duration out of range");
            }

            totalMillis = totalMillis.add(add);
            if (totalMillis.compareTo(BigInteger.valueOf(Long.MAX_VALUE)) > 0) {
                throw new IllegalArgumentException("duration out of range");
            }
        }
        return new Duration(java.time.Duration.ofMillis(totalMillis.longValue()));
    }

    @Override
    public String toString() {
        long ms = this.internalDuration.toMillis();
        if (ms == 0) {
            return "0s";
        }

        final StringBuilder sb = new StringBuilder();
        long temp = convert(sb, "y", ms, YEAR, true);
        if (temp != -1) ms = temp;

        temp = convert(sb, "w", ms, WEEK, true);
        if (temp != -1) ms = temp;

        temp = convert(sb, "d", ms, DAY, false);
        if (temp != -1) ms = temp;

        temp = convert(sb, "h", ms, HOUR, false);
        if (temp != -1) ms = temp;

        temp = convert(sb, "m", ms, MINUTE, false);
        if (temp != -1) ms = temp;

        temp = convert(sb, "s", ms, SECOND, false);
        if (temp != -1) ms = temp;

        if (ms > 0) {
            sb.append(ms).append("ms");
        }
        return sb.toString();
    }

    public java.time.Duration getDuration() {
        return this.internalDuration;
    }

    private static long convert(StringBuilder sb, String unit, long value, long convertor, boolean exactMatch) {
        if (exactMatch && value % convertor != 0) {
            return -1;
        }
        long newValue = value / convertor;
        if (newValue > 0) {
            sb.append(newValue).append(unit);
            return value - (newValue * convertor);
        }
        return -1;
    }

}
