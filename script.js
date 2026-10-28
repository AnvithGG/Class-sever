/* ==========================================
   CLASSSAVER — INTELLIGENT ENERGY GUARDIAN
   Dashboard JavaScript
   ========================================== */

"use strict";

// ==========================================
// CONFIGURATION
// ==========================================

const CONFIG = {
    temperatureFanOn: 30,
    temperatureFanOff: 28,
    brightnessThreshold: 40,
    emptyTimeoutSeconds: 30,

    // Example power ratings for the model.
    // Replace these with your actual device ratings.
    lightWatts: 40,
    fanWatts: 60,

    // Estimated comparison for energy savings.
    baselineLightHours: 8,
    baselineFanHours: 8,

    simulationInterval: 3000
};

// ==========================================
// APPLICATION STATE
// ==========================================

const state = {
    mode: "demo",

    temperature: 27,
    brightness: 25,
    motion: true,

    lights: false,
    fans: false,

    automatic: true,

    lastMotionTime: Date.now(),
    totalLightOnSeconds: 0,
    totalFanOnSeconds: 0,

    estimatedEnergySaved: 0,
    events: [],

    previousTick: Date.now()
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function $(selector) {
    return document.querySelector(selector);
}

function $all(selector) {
    return document.querySelectorAll(selector);
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function formatNumber(value, decimals = 1) {
    return Number(value).toFixed(decimals);
}

function formatTime(date = new Date()) {
    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

// ==========================================
// ACTIVITY HISTORY
// ==========================================

function logEvent(message, icon = "⚡") {
    const event = {
        message,
        icon,
        time: formatTime()
    };

    state.events.unshift(event);

    // Keep the latest 30 events.
    state.events = state.events.slice(0, 30);

    renderActivity();
}

function renderActivity() {
    const container =
        document.getElementById("activityList") ||
        document.querySelector(".activity-list");

    if (!container) return;

    if (state.events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>No activity recorded yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = state.events.map(event => `
        <div class="activity-item">
            <div class="activity-icon">
                ${event.icon}
            </div>

            <div class="activity-content">
                <h4>${escapeHTML(event.message)}</h4>
                <p>ClassSaver system event</p>
            </div>

            <span class="activity-time">
                ${escapeHTML(event.time)}
            </span>
        </div>
    `).join("");
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// ==========================================
// DEVICE CONTROL
// ==========================================

function setDevice(device, enabled, source = "system") {
    if (device !== "lights" && device !== "fans") {
        return;
    }

    enabled = Boolean(enabled);

    if (state[device] === enabled) {
        return;
    }

    state[device] = enabled;

    const deviceName =
        device === "lights" ? "Classroom lights" : "Classroom fans";

    logEvent(
        `${deviceName} turned ${enabled ? "ON" : "OFF"}`,
        device === "lights" ? "💡" : "🌀"
    );

    if (source === "manual") {
        logEvent(
            `${deviceName} changed manually`,
            "🖐️"
        );
    }

    renderDashboard();
}

// ==========================================
// AUTOMATIC ENERGY-SAVING RULES
// ==========================================

function applyAutomaticRules() {
    if (!state.automatic) return;

    const occupied = state.motion;

    const isDark =
        state.brightness < CONFIG.brightnessThreshold;

    // Turn lights on only when the room is occupied
    // and the environment is dark.
    const shouldLightsBeOn = occupied && isDark;

    if (state.lights !== shouldLightsBeOn) {
        setDevice("lights", shouldLightsBeOn);
    }

    // Temperature hysteresis prevents rapid fan switching.
    if (!occupied) {
        setDevice("fans", false);
    } else if (
        state.temperature >= CONFIG.temperatureFanOn &&
        !state.fans
    ) {
        setDevice("fans", true);
    } else if (
        state.temperature <= CONFIG.temperatureFanOff &&
        state.fans
    ) {
        setDevice("fans", false);
    }
}

// ==========================================
// SIMULATED SENSOR READINGS
// ==========================================

function simulateSensors() {
    if (state.mode !== "demo") return;

    // Simulate a changing classroom temperature.
    state.temperature = clamp(
        state.temperature + (Math.random() - 0.5) * 1.2,
        22,
        36
    );

    // Simulate changing brightness.
    state.brightness = clamp(
        state.brightness + (Math.random() - 0.5) * 12,
        0,
        100
    );

    // Simulate motion changes occasionally.
    if (Math.random() < 0.12) {
        state.motion = !state.motion;

        if (state.motion) {
            state.lastMotionTime = Date.now();
            logEvent("Motion detected in classroom", "🚶");
        } else {
            logEvent("No motion detected", "👤");
        }
    }

    applyAutomaticRules();
    renderDashboard();
}

// ==========================================
// ENERGY CALCULATIONS
// ==========================================

function calculateEnergy() {
    const now = Date.now();

    const elapsedSeconds = Math.max(
        0,
        (now - state.previousTick) / 1000
    );

    state.previousTick = now;

    if (state.lights) {
        state.totalLightOnSeconds += elapsedSeconds;
    }

    if (state.fans) {
        state.totalFanOnSeconds += elapsedSeconds;
    }

    // Convert operating time into estimated kWh.
    const lightEnergy =
        CONFIG.lightWatts *
        state.totalLightOnSeconds / 3600000;

    const fanEnergy =
        CONFIG.fanWatts *
        state.totalFanOnSeconds / 3600000;

    const totalEnergy = lightEnergy + fanEnergy;

    // Simplified illustrative estimate:
    // Assumes each device would otherwise run for
    // the configured baseline number of hours per day.
    const elapsedHours =
        (now - appStartTime) / 3600000;

    const baselineEnergy = (
        CONFIG.lightWatts * CONFIG.baselineLightHours +
        CONFIG.fanWatts * CONFIG.baselineFanHours
    ) / 1000;

    const baselineForElapsedTime =
        baselineEnergy * Math.min(elapsedHours / 24, 1);

    const saved = Math.max(
        0,
        baselineForElapsedTime - totalEnergy
    );

    state.estimatedEnergySaved = saved;

    return {
        lightEnergy,
        fanEnergy,
        totalEnergy,
        saved
    };
}

const appStartTime = Date.now();

// ==========================================
// DASHBOARD DISPLAY
// ==========================================

function renderDashboard() {
    const energy = calculateEnergy();

    // Temperature
    setText(
        "temperature",
        `${formatNumber(state.temperature)}°C`
    );

    setText(
        "temperatureValue",
        `${formatNumber(state.temperature)}°C`
    );

    // Brightness
    setText(
        "brightness",
        `${Math.round(state.brightness)}%`
    );

    setText(
        "brightnessValue",
        `${Math.round(state.brightness)}%`
    );

    // Motion status
    setText(
        "motionStatus",
        state.motion ? "Occupied" : "Empty"
    );

    setText(
        "occupancy",
        state.motion ? "Occupied" : "No motion"
    );

    // Device status
    setText(
        "lightStatus",
        state.lights ? "ON" : "OFF"
    );

    setText(
        "fanStatus",
        state.fans ? "ON" : "OFF"
    );

    setText(
        "lightsStatus",
        state.lights ? "ON" : "OFF"
    );

    setText(
        "fansStatus",
        state.fans ? "ON" : "OFF"
    );

    // Energy readings
    setText(
        "energyUsed",
        `${formatNumber(energy.totalEnergy, 4)} kWh`
    );

    setText(
        "energySaved",
        `${formatNumber(energy.saved, 4)} kWh`
    );

    setText(
        "lightEnergy",
        `${formatNumber(energy.lightEnergy, 4)} kWh`
    );

    setText(
        "fanEnergy",
        `${formatNumber(energy.fanEnergy, 4)} kWh`
    );

    // Mode
    setText(
        "systemMode",
        state.automatic ? "Automatic" : "Manual"
    );

    // Update controls and status labels.
    updateDeviceControls();
    updateProgressBars();
    updateConnectionStatus();
}

// ==========================================
// DEVICE SWITCHES
// ==========================================

function updateDeviceControls() {
    const lightSwitch = document.getElementById("lightSwitch");
    const fanSwitch = document.getElementById("fanSwitch");
    const autoSwitch = document.getElementById("autoSwitch");

    if (lightSwitch) {
        lightSwitch.checked = state.lights;
    }

    if (fanSwitch) {
        fanSwitch.checked = state.fans;
    }

    if (autoSwitch) {
        autoSwitch.checked = state.automatic;
    }

    // Also support switches identified by data attributes.
    $all("[data-device='lights']").forEach(control => {
        control.checked = state.lights;
    });

    $all("[data-device='fans']").forEach(control => {
        control.checked = state.fans;
    });
}

// ==========================================
// SENSOR PROGRESS BARS
// ==========================================

function updateProgressBars() {
    const brightnessBar =
        document.getElementById("brightnessBar");

    if (brightnessBar) {
        brightnessBar.style.width =
            `${clamp(state.brightness, 0, 100)}%`;
    }

    const temperatureBar =
        document.getElementById("temperatureBar");

    if (temperatureBar) {
        const percentage = clamp(
            ((state.temperature - 15) / 25) * 100,
            0,
            100
        );

        temperatureBar.style.width = `${percentage}%`;
    }
}

// ==========================================
// MANUAL CONTROLS
// ==========================================

function toggleDevice(device, enabled) {
    if (state.mode !== "demo") {
        logEvent(
            "Manual hardware control requires a connected control API",
            "⚠️"
        );
        return;
    }

    setDevice(device, enabled, "manual");
}

function setAutomaticMode(enabled) {
    state.automatic = Boolean(enabled);

    logEvent(
        `Automatic mode ${state.automatic ? "enabled" : "disabled"}`,
        "⚙️"
    );

    if (state.automatic) {
        applyAutomaticRules();
    }

    renderDashboard();
}

// ==========================================
// CONNECTION STATUS
// ==========================================

function updateConnectionStatus() {
    const status =
        document.getElementById("connectionStatus");

    if (!status) return;

    if (state.mode === "demo") {
        status.textContent = "Demo Mode";
        status.classList.add("status-offline");
    } else {
        status.textContent = "ESP32 Connected";
        status.classList.remove("status-offline");
    }
}

// ==========================================
// RESET DEMO
// ==========================================

function resetDemo() {
    state.temperature = 27;
    state.brightness = 25;
    state.motion = true;

    state.lights = false;
    state.fans = false;
    state.automatic = true;

    state.lastMotionTime = Date.now();

    state.totalLightOnSeconds = 0;
    state.totalFanOnSeconds = 0;
    state.estimatedEnergySaved = 0;

    state.previousTick = Date.now();

    state.events = [];

    logEvent("ClassSaver demo has been reset", "🔄");

    applyAutomaticRules();
    renderDashboard();
}

// ==========================================
// BUTTON EVENT LISTENERS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // Light switch
    const lightSwitch = document.getElementById("lightSwitch");

    if (lightSwitch) {
        lightSwitch.addEventListener("change", event => {
            toggleDevice("lights", event.target.checked);
        });
    }

    // Fan switch
    const fanSwitch = document.getElementById("fanSwitch");

    if (fanSwitch) {
        fanSwitch.addEventListener("change", event => {
            toggleDevice("fans", event.target.checked);
        });
    }

    // Automatic mode switch
    const autoSwitch = document.getElementById("autoSwitch");

    if (autoSwitch) {
        autoSwitch.addEventListener("change", event => {
            setAutomaticMode(event.target.checked);
        });
    }

    // Reset button
    const resetButton = document.getElementById("resetDemo");

    if (resetButton) {
        resetButton.addEventListener("click", resetDemo);
    }

    // Additional controls using data attributes.
    $all("[data-action='reset']").forEach(button => {
        button.addEventListener("click", resetDemo);
    });

    // Start the dashboard.
    logEvent("ClassSaver dashboard initialized", "🚀");

    applyAutomaticRules();
    renderDashboard();

    // Update energy values regularly.
    setInterval(() => {
        calculateEnergy();
        renderDashboard();
    }, 1000);

    // Update simulated sensor readings.
    setInterval(
        simulateSensors,
        CONFIG.simulationInterval
    );
});