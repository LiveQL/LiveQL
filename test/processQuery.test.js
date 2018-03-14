const processQuery = require('./../src/server/processQuery');
const { queue } = require('./reactiveDataLayer');
const queryHash = require('./queryHash');

// Setup fake req, res, and next variables.

const req = {};
const res = {};
const next = () => undefined;

req.body = {};
res.locals = {};


