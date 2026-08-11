const session = require('express-session');
const pgSessionFactory = require('connect-pg-simple');
const pool = require('../config/db');

const PgSession = pgSessionFactory(session);
const isProduction = process.env.NODE_ENV === 'production';

module.exports = session({
  store: new PgSession({
    pool,
    tableName: 'app_sessions',
    createTableIfMissing: false
  }),
  name: process.env.SESSION_COOKIE_NAME || 'petid.sid',
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: Number(process.env.SESSION_MAX_AGE_MS || 7200000)
  }
});
