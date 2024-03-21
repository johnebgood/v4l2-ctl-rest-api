const config = require('../config.json');
const express = require('express');
const logger = require("morgan");
const cors = require("cors");
const bodyParser = require('body-parser');
const generateSettingRoute = require('./lib/generateSettingRoute');
const http = require('http');
const WebSocket = require('ws');
const v4l2ctl = require('./lib/v4l2ctl');

//const { Worker } = require('worker_threads');

// Set your default camera here
let camera = "video0";

const app = express();

const server = http.createServer(app);

// Attach the WebSocket server to the same HTTP server
const wsServer = new WebSocket.Server({ server });

// WebSocket connection handler
wsServer.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        const params = message.toString().split("&");
        // If we have more than 2 key=value pairs assume, camera, pan, tilt
        if (params.length > 2) {
            const cameraParts = params[0].toString().split("=");
            const panParts = params[1].toString().split("=");
            const tiltParts = params[2].toString().split("=");
            v4l2ctl.flyxy(cameraParts[1],panParts[1],tiltParts[1]);
        }
        // If we have 2 key=value pairs, assume camera, zoom
        else if(params.length > 1) {
            const cameraParts = params[0].toString().split("=");
            const zoomParts = params[1].toString().split("=");   
            v4l2ctl.flyz(cameraParts[1],zoomParts[1]);
        }
        // Otherwise, handle each parameter as sent
        else {
            const parts = message.toString().split("="); 
            const key = parts[0]; 
            let value = parts[1]; 
            if (key === "pan_speed") {
                v4l2ctl.flyx(camera, value);
            }
            else if (key === "tilt_speed") {
                v4l2ctl.flyy(camera, value);
            }
            else if (key === "zoom_continuous") {
                v4l2ctl.flyz(camera, value);
            }
            // Camera defaults to video0 (/dev/video0) Set to another by number or name
            // camera=0 will become /dev/video0
            // camera=mycameraname will become /dev/mycameraname
            else if (key === "camera") {
                camera = v4l2ctl.getFullCameraPath(value);
                console.log(camera);
            }
        }
    });
});

app.use(logger("dev"));
app.use(cors());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use((req, res, next) => {
    console.log("Query String:", req.query); // This logs the query string object to the console
    next(); // Pass control to the next middleware function
});

// Routes
const index = require('./routes/index');
app.use('/', index);

// TODO: make a route that dynamically determines the specific camera's 
// settings by parsing v4l2-ctl -d <device> -l instead of using config.json
// future implementation should be /<device>/settings
const settings = require('./routes/settings');
app.use('/settings', settings);

const control = require('./routes/control');
app.use('/control', control);

for (let setting of require('./controls.json')) {
    app.use('/', generateSettingRoute(setting.name, setting.min, setting.max));
}

// error handler
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    console.log(err.message);
});

const listener = server.listen(config.port, function () {
    console.log("Listening on +:" + listener.address().port);
});

module.exports = app;
