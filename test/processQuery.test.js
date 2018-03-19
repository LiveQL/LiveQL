const processQuery = require('./../src/liveql/processQuery');
const queryHash = require('./../src/liveql/queryHash');
const { subscriptions } = require('./../src/liveql/reactiveDataLayer');
const liveConfig = require('./../src/liveql/liveqlConfig');

liveConfig.set();
// Setup fake req, res, subscriptions, and next variables.
const req = {};
const res = {};
const next = () => undefined;

req.body = {};
res.locals = {};


test('Simple query, one user', () => {
  req.body.query = `
    query @live {
      Topics {
        content
        id
      }
    }
  `;
  processQuery(req, res, next);
  const hash = queryHash(req.body.query);
  expect(subscriptions[hash]).toBeTruthy();
  expect(subscriptions[hash].listeners).toEqual(1);
  expect(subscriptions[hash].query).toEqual(req.body.query.trim());
});

test('Simple query, two users', () => {
  req.body.query = `
    query @live {
      Topics {
        content
        id
      }
    }
  `;
  processQuery(req, res, next);
  const hash = queryHash(req.body.query);
  expect(subscriptions[hash]).toBeTruthy();
  expect(subscriptions[hash].listeners).toEqual(2);
  expect(subscriptions[hash].query).toEqual(req.body.query.trim());
});


test('Nested query with variables', () => {
  req.body.query = `
    query Testing($id: ID!) @live {
      Topic(id: $id) {
        id
        author
        comments {
          id
          author
        }
      }
    }
  `;
  req.body.variables = { id: '5a9b26de4d33148fb6718928' };
  processQuery(req, res, next);
  const hash = queryHash(req.body.query, req.body.variables);
  expect(subscriptions[hash]).toBeTruthy();
  expect(subscriptions[hash].listeners).toEqual(1);
  expect(subscriptions[hash].query).toEqual(req.body.query.trim());
});