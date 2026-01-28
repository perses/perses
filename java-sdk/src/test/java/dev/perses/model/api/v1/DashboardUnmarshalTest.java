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

package dev.perses.model.api.v1;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

public class DashboardUnmarshalTest {
    private final ObjectMapper mapper = new ObjectMapper();

    private String readResource(String resourcePath) throws Exception {
        try (InputStream is = getClass().getResourceAsStream(resourcePath)) {
            assertNotNull(is, "resource not found: " + resourcePath);
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    @Test
    public void testUnmarshalFullDashboard() throws Exception {
        String json = readResource("/dev/perses/model/api/v1/full_dashboard.json");

        Dashboard d = mapper.readValue(json, Dashboard.class);
        assertNotNull(d);
        assertNotNull(d.kind);
        assertEquals(Kind.DASHBOARD, d.kind);
        assertNotNull(d.metadata);
        assertEquals("my-dashboard", d.metadata.name);
        assertEquals("default", d.metadata.project);
        assertNotNull(d.spec);
        assertNotNull(d.spec.display);
        assertEquals("My Dashboard", d.spec.display.name);
        assertEquals("A test dashboard", d.spec.display.description);
        assertNotNull(d.spec.datasources);
        assertTrue(d.spec.datasources.containsKey("prom"));
        assertNotNull(d.spec.variables);
        assertEquals(0, d.spec.variables.size());
    }
}
