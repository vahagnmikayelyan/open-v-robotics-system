const config = {
  port: 3000,
  sqLiteDBPath: 'db/robot.db',
  webBuildPath: 'public/browser',
  debugLog: true,
  errorLog: true,
  speakerSinkName: 'robot_echo_cancel_sink',
  speakerMinWpctl: 0.30,
  speakerMaxWpctl: 1.20,
};

export default config;
