import { createServer } from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config.js';

import HardwareController from './services/hardware-controller.js';
import SocketHandler from './services/socket-handler.js';

const app = express();
const server = createServer({}, app);

const hardwareController = new HardwareController();

SocketHandler(server, hardwareController);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webBuildPath = path.join(__dirname, config.webBuildPath);

app.use(express.static(webBuildPath));
app.get('*', (req, res) => {
    res.sendFile(path.join(webBuildPath, 'index.html'));
});

console.log('Server Listening on PORT:', config.port);

server.listen(config.port, '0.0.0.0');