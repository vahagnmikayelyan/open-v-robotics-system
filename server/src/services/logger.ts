import config from '../config.js';

export const Logger = {
  debugLog: (message: string, sender: string = '', params: any = '') => {
    if (config.debugLog) {
      console.log(sender ? `[${sender}]: ` : '', message, params);
    }
  },
  errorLog: (message: string, sender: string = '', params: any = '') => {
    if (config.errorLog) {
      console.error(sender ? `[${sender} Error]: ` : '', message, params);
    }
  },
};
