# ClassSaver Smart Classroom Energy Guardian

## Included
- `index.html`: dark dashboard, device controls, energy calculator, charts, classroom illustration.
- `server.js`: small Node.js server that serves the page and accepts ESP32 telemetry.
- `esp32_classsaver.ino`: starter firmware for ESP32 + PIR + LDR + DHT22 + three LEDs + a low-voltage DC fan driver.

## Run the website
1. Install Node.js.
2. Extract this folder.
3. Open a terminal in this folder.
4. Run `npm start`.
5. Open `http://localhost:3000` in your browser.

## Demo vs hardware
The page initially uses simulated sensor readings. To connect real hardware, run the server on a computer on the same Wi-Fi as the ESP32, then use the dashboard's **Connect ESP32** button and enter the computer's LAN address, for example `http://192.168.1.10:3000`.

This starter includes a telemetry GET/POST endpoint. The dashboard's manual controls are demo-only; real remote control requires a command API and corresponding firmware polling/command handling.

## Energy figures
The dashboard estimates energy from configured device power (watts) and operating hours. PIR and LDR do not measure energy. For actual measured kWh, add a suitable low-voltage energy sensor/power meter and integrate its readings.

## Safety
Use only suitable low-voltage DC fans for the school model. Do not connect a fan directly to an ESP32 GPIO. Use a suitable transistor/MOSFET driver module, with a common ground where required, and a suitable separate fan supply. Real mains-powered classroom fans require proper rated equipment and qualified electrical installation. Do not wire mains voltage on a breadboard.
