import os from 'os';
import { exec } from 'node:child_process';
import { Request, Response } from 'express';

import { Logger } from '../services/logger.js';
import { availableAIModels } from '../configs/ai-models.js';
import { getAllModuleMetadata, moduleCategories } from '../modules/module-registry.js';

const ApiUtilsController = () => {
  const getLocalIpAddress = () => {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
      if (interfaces[name]) {
        for (const info of interfaces[name]) {
          if (info.family === 'IPv4' && !info.internal) {
            return info.address;
          }
        }
      }
    }
    return '127.0.0.1';
  };

  return {
    getConnectionInfo: async (_: Request, res: Response) => {
      try {
        const ip = getLocalIpAddress();
        res.status(200).json({ ip });
      } catch (error: any) {
        Logger.errorLog(error.message, 'Utils API');
        res.status(400).json({ error: 'Failed to get connection info' });
      }
    },

    getAiModels: async (_: Request, res: Response) => {
      try {
        const models = availableAIModels || [];
        res.status(200).json(models);
      } catch (error: any) {
        Logger.errorLog(error.message, 'Utils API');
        res.status(400).json({ error: 'Failed to get AI models' });
      }
    },

    getAvailableModules: async (_: Request, res: Response) => {
      try {
        res.status(200).json(getAllModuleMetadata());
      } catch (error: any) {
        Logger.errorLog(error.message, 'Utils API');
        res.status(400).json({ error: 'Failed to get available modules' });
      }
    },

    getModuleCategories: async (_: Request, res: Response) => {
      try {
        res.status(200).json(moduleCategories);
      } catch (error: any) {
        Logger.errorLog(error.message, 'Utils API');
        res.status(400).json({ error: 'Failed to get module categories' });
      }
    },

    reboot: async (_: Request, res: Response) => {
      Logger.debugLog('Reboot requested from UI', 'Utils API');
      res.status(200).json({ ok: true });
      // Execute after response is sent
      setTimeout(() => exec('sudo shutdown -r now'), 500);
    },

    powerOff: async (_: Request, res: Response) => {
      Logger.debugLog('Power off requested from UI', 'Utils API');
      res.status(200).json({ ok: true });
      // Execute after response is sent
      setTimeout(() => exec('sudo shutdown -h now'), 500);
    },

    scanWifi: async (_: Request, res: Response) => {
      Logger.debugLog('Scanning Wi-Fi networks via nmcli', 'Utils API');
      
      // Trigger a rescan, and wait 1.5 seconds for NetworkManager to update the cache
      exec('sudo nmcli dev wifi rescan', () => {
        setTimeout(() => {
          exec('sudo nmcli -t -f SSID,SIGNAL,SECURITY dev wifi list', (error, stdout) => {
        if (error) {
          Logger.errorLog(error.message, 'Wifi API');
          return res.status(400).json({ error: 'Failed to scan Wi-Fi networks' });
        }

        const networks: Array<{ ssid: string; signal: number; security: string }> = [];
        const seen = new Set<string>();

        const lines = stdout.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          const parts = trimmed.split(':');
          if (parts.length < 3) continue;

          const security = parts.pop() || '';
          const signalStr = parts.pop() || '0';
          const ssid = parts.join(':').trim(); // Handle SSIDs that contain colons

          if (!ssid) continue;

          if (seen.has(ssid)) continue;
          seen.add(ssid);

          networks.push({
            ssid,
            signal: parseInt(signalStr, 10) || 0,
            security: security.trim(),
          });
        }

        // Sort by signal strength descending
        networks.sort((a, b) => b.signal - a.signal);

        res.status(200).json(networks);
      });
        }, 1500);
      });
    },

    connectWifi: async (req: Request, res: Response) => {
      const { ssid, password } = req.body;
      if (!ssid) {
        return res.status(400).json({ error: 'SSID is required' });
      }

      Logger.debugLog(`Attempting to connect to Wi-Fi: ${ssid}`, 'Utils API');

      const escapedSsid = ssid.replace(/(["'$`\\])/g, '\\$1');
      const escapedPassword = (password || '').replace(/(["'$`\\])/g, '\\$1');

      const command = password
        ? `sudo nmcli dev wifi connect "${escapedSsid}" password "${escapedPassword}"`
        : `sudo nmcli dev wifi connect "${escapedSsid}"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          Logger.errorLog(`Connection failed to ${ssid}: ${error.message} - ${stderr}`, 'Utils API');
          return res.status(400).json({ error: stderr || error.message || 'Failed to connect to Wi-Fi' });
        }
        Logger.debugLog(`Successfully connected to ${ssid}: ${stdout}`, 'Utils API');
        res.status(200).json({ success: true, message: stdout.trim() });
      });
    },

    getWifiStatus: async (_: Request, res: Response) => {
      exec('sudo nmcli -t -f DEVICE,TYPE,STATE,CONNECTION device', (error, stdout) => {
        if (error) {
          Logger.errorLog(error.message, 'Utils API');
          return res.status(400).json({ error: 'Failed to get Wi-Fi status' });
        }

        let connectedSsid: string | null = null;

        const lines = stdout.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          const parts = trimmed.split(':');
          if (parts.length >= 4 && parts[1] === 'wifi' && parts[2] === 'connected') {
            connectedSsid = parts[3];
            break;
          }
        }

        res.status(200).json({ connected: !!connectedSsid, ssid: connectedSsid });
      });
    },
  };
};

export default ApiUtilsController;
