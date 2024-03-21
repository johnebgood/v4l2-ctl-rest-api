const fs = require('fs');
const execute = require("./execute");
const getCtrlParser = require('./getCtrlParser');
const exec = require("child_process").exec;

// Callback for getting a camera control
function getControlCallback(output, resolve, reject) {
    if(output.stderr) {
        return reject(data.stderr);
    }

    return resolve(getCtrlParser(output.stdout));
}

// Callback for setting a camera control
function setControlCallback(output, control, value, resolve, reject) {
    if(output.stderr) {
        return reject(data.stderr);
    }

    return resolve({
        setting: control,
        value: value
    });
}

/**
 * Gets the specified control for the device using by-path.
 * @param {string} portId the USB port ID
 * @param {string} control the control name
 */
function getControlByPath(portId, control) {
    return new Promise((resolve, reject) => {
        execute(`v4l2-ctl -d /dev/v4l/by-path/platform-3f980000.usb-usb-0:${portId}:1.0-video-index0 --get-ctrl ${control}`)
            .then(output => getControlCallback(output, resolve, reject))
            .catch(error => reject(error));
    });
}

/**
 * Gets the specified control for the device.
 * For example, to get the brightness for /dev/video0, you
 * would call: getControl(0, 'brightness').
 * @param {number} deviceId the device number of the camera
 * @param {string} control the control name
 */
function getControl(deviceName, control) {
    return new Promise((resolve, reject) => {
        execute(`v4l2-ctl -d /dev/${deviceName} --get-ctrl ${control}`)
            .then(output => getControlCallback(output, resolve, reject))
            .catch(error => reject(error));
    });
}

/**
 * Sets the specified control value for the device using by-path.
 * @param {string} portId the USB port ID
 * @param {string} control the control name
 * @param {number} value the desired value
 * @return the new setting for the device
 */
function setControlByPath(portId, control, value) {
    return new Promise((resolve, reject) => {
        execute(`v4l2-ctl -d /dev/v4l/by-path/platform-3f980000.usb-usb-0:${portId}:1.0-video-index0 --set-ctrl=${control}=${value}`)
            .then(output => setControlCallback(output, control, value, resolve, reject))
            .catch(error => reject(error));
    });
}

/**
 * Sets the specified control value for the device.
 * For example, to set the brightness for /dev/video0 
 * to 140, you would call: setControl(0, 'brightness', 140).
 * @param {number} deviceId the device number of the camera
 * @param {string} control the control name
 * @param {number} value the desired value
 * @return the new setting for the device
 */
function setControl(deviceName, control, value) {
    return new Promise((resolve, reject) => {
        execute(`v4l2-ctl -d /dev/${deviceName} --set-ctrl=${control}=${value}`)
            .then(output => setControlCallback(output, control, value, resolve, reject))
            .catch(error => reject(error));
    });
}

function flyxy(deviceName, panSpeed, tiltSpeed) {
    deviceName = getFullCameraPath(deviceName);
    //console.log(`v4l2-ctl -d /dev/video${deviceId} --set-ctrl=pan_speed=${panSpeed}`);
    exec(`v4l2-ctl -d ${deviceName} --set-ctrl=pan_speed=${panSpeed},tilt_speed=${tiltSpeed}`);
}

function flyx(deviceName, panSpeed) {
    deviceName = getFullCameraPath(deviceName);
    //console.log(`v4l2-ctl -d ${deviceName} --set-ctrl=pan_speed=${panSpeed}`);
    exec(`v4l2-ctl -d ${deviceName} --set-ctrl=pan_speed=${panSpeed}`);
}

function flyy(deviceName, tiltSpeed) {
    deviceName = getFullCameraPath(deviceName);
    exec(`v4l2-ctl -d ${deviceName} --set-ctrl=tilt_speed=${tiltSpeed}`);
}

function flyz(deviceName, zoomSpeed) {
    deviceName = getFullCameraPath(deviceName);
    exec(`v4l2-ctl -d ${deviceName} --set-ctrl=zoom_continuous=${zoomSpeed}`);
}

function getFullCameraPath(desiredCamera) {
    let camNum = -1;
    let camPath = '/dev/video0';
    camera = desiredCamera.trim();
    camNum = parseInt(camera);
    if (camNum >= 0) {
        camPath = `/dev/video${camNum}`;
        console.log("getFullCameraPath:",camPath);
        return camPath;
    }
    else if(desiredCamera.startsWith('/dev/')){ 
        return desiredCamera;
    }
    else {
        return `/dev/${desiredCamera}`;
    }
}

module.exports.getControlByPath = getControlByPath;
module.exports.getControl = getControl;
module.exports.setControlByPath = setControlByPath;
module.exports.setControl = setControl;
module.exports.flyxy = flyxy;
module.exports.flyx = flyx;
module.exports.flyy = flyy;
module.exports.flyz = flyz;
module.exports.getFullCameraPath = getFullCameraPath;

