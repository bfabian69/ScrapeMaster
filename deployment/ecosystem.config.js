module.exports = {
  apps: [{
    name: 'scrapemaster',
    script: 'npx',
    args: 'serve -s dist -l 3000',
    cwd: '/var/www/scrapemaster',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}