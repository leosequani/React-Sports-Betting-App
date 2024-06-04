const Redis = require('ioredis');

const redisConfig = new Redis({
  host: '127.0.0.1',
  port: '6379',
  username: "default",
  password: 'tHJvbDYGX5dL2wFrcUH3XblaQgso7Hkp'
});

module.exports = redisConfig;