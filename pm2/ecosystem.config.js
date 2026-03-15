module.exports = {
  apps: [{
    name: "open-v-robotics-system",
    cwd: 'open-v-robotics-system/server',
    script: "./dist/index.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: "production",
    },
    ulimit: 0
  }]
};
