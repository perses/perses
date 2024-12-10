// Copyright 2024 The Perses Authors
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

package migrate

#mapping: {
    // mapping table for the unit attribute (key = grafana unit, value = perses equivalent)
    unit: {
        // time units
        ms: "milliseconds"
        s: "seconds"
        m: "minutes"
        h: "hours"
        d: "days"
        dtdurations: "seconds"
        dtdurationms: "milliseconds"
        // percent units
        percent: "percent"
        percentunit: "percent-decimal"
        // decimal units
        // TODO
        // bytes units
        bytes: "bytes"
        decbytes: "bytes"
        // throughput units
        bps: "bits/sec"
        Bps: "bytes/sec"
        cps: "counts/sec"
        // TODO add mappings for all throughput units
    }
    // mapping table for the calculation attribute (key = grafana unit, value = perses equivalent)
    calc: {
        // Values with a single potential mapping.
        first: "first"
        firstNotNull: "first-number"
        lastNotNull: "last-number"
        min: "min"
        max: "max"

        // Both keys can be used for "Last" depending on the version of grafana
        // and how the calculation is being used (e.g. chart vs table legend
        // value).
        current: "last"
        last: "last"

        // Both keys can be used for "Mean" depending on the version of grafana
        // and how the calculation is being used (e.g. chart vs table legend
        // value).
        avg: "mean"
        mean: "mean"

        // Both keys can be used for "Mean" depending on the version of grafana
        // and how the calculation is being used (e.g. chart vs table legend
        // value).
        total: "sum"
        sum: "sum"
    }
    // mapping array for the sort attribute (index = grafana sort id, value = perses equivalent)
    sort: ["none", "alphabetical-asc", "alphabetical-desc", "numerical-asc", "numerical-desc", "alphabetical-ci-asc", "alphabetical-ci-desc"]
    color: {
        // mapping array for some color attributes (index = color name in Grafana, value = hexadecimal equivalent that Perses can deal with)
        "dark-red": "#c4162a"
        "semi-dark-red": "#e02f44"
        "red": "#f2495c"
        "light-red": "#ff7383"
        "super-light-red": "#ffa6b0"

        "dark-orange": "#fa6400"
        "semi-dark-orange": "#ff780a"
        "orange": "#ff9830"
        "light-orange": "#ffb357"
        "super-light-orange": "#ffcb7d"

        "dark-green": "#37872d"
        "semi-dark-green": "#56a64b"
        "green": "#73bf69"
        "light-green": "#96d98d"
        "super-light-green": "#c8f2c2"

        "dark-blue": "#1f60c4"
        "semi-dark-blue": "#3274d9"
        "blue": "#5794f2"
        "light-blue": "#8ab8ff"
        "super-light-blue": "#c0d8ff"

        "dark-purple": "#8f3bb8"
        "semi-dark-purple": "#a352cc"
        "purple": "#b877d9"
        "light-purple": "#b877d9"
        "super-light-purple": "#deb6f2"

        "dark-yellow": "#e0b400"
        "semi-dark-yellow": "#f2cc0c"
        "yellow": "#fade2a"
        "light-yellow": "#ffee52"
        "super-light-yellow": "#fff899"
    }
}
#defaultCalc: "last"
