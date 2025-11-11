package dev.perses.sdk.dashboard;

import dev.perses.model.api.v1.Dashboard;
import dev.perses.model.api.v1.common.Display;
import dev.perses.model.api.v1.common.duration.Duration;
import dev.perses.model.api.v1.dashboard.Variable;
import dev.perses.model.api.v1.dashboard.panel.Panel;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class DashboardBuilder {
    private final Dashboard dashboard;

    public DashboardBuilder() {
        this.dashboard = new Dashboard();
    }

    public DashboardBuilder project(String project) {
        this.dashboard.metadata.project = project;
        return this;
    }

    public DashboardBuilder name(String name) {
        this.dashboard.metadata.name = name;
        if (this.dashboard.spec.display != null && this.dashboard.spec.display.name.isEmpty()) {
            this.dashboard.spec.display.name = name;
        }
        return this;
    }

    public DashboardBuilder display(String name) {
        this.newDisplayIfNeeded();
        this.dashboard.spec.display.name = name;
        return this;
    }

    public DashboardBuilder description(String description) {
        this.newDisplayIfNeeded();
        if (this.dashboard.spec.display.name.isEmpty()) {
            this.dashboard.spec.display.name = this.dashboard.metadata.name;
        }
        this.dashboard.spec.display.description = description;
        return this;
    }

    public DashboardBuilder variable(Variable... variable) {
        if (this.dashboard.spec.variables == null) {
            this.dashboard.spec.variables = new ArrayList<>();
        }
        Collections.addAll(this.dashboard.spec.variables, variable);
        return this;
    }

    public DashboardBuilder variables(List<Variable> variables) {
        this.dashboard.spec.variables = variables;
        return this;
    }

    // TODO add Panel builders

    public DashboardBuilder duration(String duration) {
        this.dashboard.spec.duration = Duration.parse(duration);
        return this;
    }

    public DashboardBuilder duration(Duration duration) {
        this.dashboard.spec.duration = duration;
        return this;
    }

    public DashboardBuilder duration(java.time.Duration duration) {
        this.dashboard.spec.duration = new Duration(duration);
        return this;
    }

    public DashboardBuilder refreshInterval(Duration refreshInterval) {
        this.dashboard.spec.refreshInterval = refreshInterval;
        return this;
    }

    public DashboardBuilder refreshInterval(String refreshInterval) {
        this.dashboard.spec.refreshInterval = Duration.parse(refreshInterval);
        return this;
    }

    public DashboardBuilder refreshInterval(java.time.Duration refreshInterval) {
        this.dashboard.spec.refreshInterval = new Duration(refreshInterval);
        return this;
    }

    private void newDisplayIfNeeded() {
        if (this.dashboard.spec.display == null) {
            this.dashboard.spec.display = new Display();
        }
    }
}
