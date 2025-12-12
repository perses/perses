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

package dev.perses.model.api.v1.dashboard;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import dev.perses.model.api.v1.common.JSONRef;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class Layout {
    public enum LayoutKind {Grid}

    @JsonProperty(value = "kind", required = true)
    public LayoutKind kind;

    @JsonProperty("spec")
    public Object spec; // GridLayoutSpec when kind == Grid

    public static class GridItem {
        @JsonProperty("x")
        public int x;
        @JsonProperty("y")
        public int y;
        @JsonProperty("width")
        public int width;
        @JsonProperty("height")
        public int height;
        @JsonProperty("content")
        public JSONRef content;
    }

    public static class GridLayoutCollapse {
        @JsonProperty("open")
        public boolean open;
    }

    public static class GridLayoutDisplay {
        @JsonProperty("title")
        public String title;
        @JsonProperty("collapse")
        public GridLayoutCollapse collapse;
    }

    public static class GridLayoutSpec {
        @JsonProperty("display")
        public GridLayoutDisplay display;
        @JsonProperty(value = "items", required = true)
        public java.util.List<GridItem> items;
        @JsonProperty("repeatVariable")
        public String repeatVariable;
    }

    public Layout() {
    }
}
