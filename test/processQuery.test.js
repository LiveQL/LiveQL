const processQuery = require('./../src/server/processQuery');
const queryHash = require('./../src/server/queryHash');
const { queue } = require('./../src/server/reactiveDataLayer');

// Setup fake req, res, queue, and next variables.
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
  expect(queue[hash]).toBeTruthy();
  expect(queue[hash].listeners).toEqual(1);
  expect(queue[hash].query).toEqual(req.body.query.trim());
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
  expect(queue[hash]).toBeTruthy();
  expect(queue[hash].listeners).toEqual(2);
  expect(queue[hash].query).toEqual(req.body.query.trim());
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
  expect(queue[hash]).toBeTruthy();
  expect(queue[hash].listeners).toEqual(1);
  expect(queue[hash].query).toEqual(req.body.query.trim());
});