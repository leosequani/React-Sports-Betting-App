const Redis = require('ioredis');

const redisConfig = new Redis({
  host: 'redis-17944.c8.us-east-1-3.ec2.redns.redis-cloud.com',
  port: '17944',
  username: "default",
  password: 'tHJvbDYGX5dL2wFrcUH3XblaQgso7Hkp'
});

module.exports = redisConfig;