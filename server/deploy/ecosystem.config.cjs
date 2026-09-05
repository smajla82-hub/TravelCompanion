module.exports = {
  apps: [
    {
      name: 'travel-companion-api',
      script: 'src/server.js',
      cwd: '/path/to/TravelCompanion/server',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DB_PATH: './data/travel-companion.db',
        ALLOWED_CORS_ORIGIN: 'https://smajla82-hub.github.io',
      },
      error_file: '/path/to/TravelCompanion/server/logs/api-error.log',
      out_file: '/path/to/TravelCompanion/server/logs/api-out.log',
      log_file: '/path/to/TravelCompanion/server/logs/api-combined.log',
      time: true,
    },
  ],
};
