import { createServer } from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config.js';
import { defaultSettings } from './configs/default-settings.js';

import ModuleController from './services/module-controller.js';
import SystemController from './services/system-controller.js';
import SocketHandler from './services/socket-handler.js';
import SqliteClient from './database/sqlite-client.js';
import ApiHandler from './services/api-handler.js';
import ConfigController from './services/config-controller.js';
import ConfigRepository from './repositories/sqlite/config-repository.js';

const __filename = fileURLToPath(import.meta.url);
const baseDirectory = path.dirname(path.resolve(__filename, '..'));

const app = express();
const server = createServer({}, app);

const dbClient = new SqliteClient(path.join(baseDirectory, config.sqLiteDBPath), defaultSettings);

const configController = new ConfigController(new ConfigRepository(dbClient.getInstance()));
const moduleController = new ModuleController(configController);
const systemController = new SystemController(dbClient.getInstance(), moduleController, configController);

ApiHandler(app, dbClient.getInstance());
SocketHandler(server, moduleController, systemController);

const webBuildPath = path.join(baseDirectory, config.webBuildPath);

app.use(express.static(webBuildPath));
app.get('*', (_, res) => {
  res.sendFile(path.join(webBuildPath, 'index.html'));
});

console.log('Server Listening on PORT:', config.port);

server.listen(config.port, '0.0.0.0');
