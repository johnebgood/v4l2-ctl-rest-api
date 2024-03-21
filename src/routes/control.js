const express = require("express");
const router = express.Router();

router.post('/', (req, res) => {
    const { cameraId, settings } = req.body; // Assuming these are passed in the request
    const worker = new Worker('./cameraWorker.js', {
        workerData: { cameraId, settings }
    });

    worker.on('message', (message) => {
        console.log('Worker message:', message);
        res.json({ status: 'success', message });
    });

    worker.on('error', (error) => {
        console.error('Worker error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    });

    worker.on('exit', (code) => {
        if (code !== 0) {
            console.error(`Worker stopped with exit code ${code}`);
        }
    });
});



module.exports = router;
