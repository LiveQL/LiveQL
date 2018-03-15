const liveql = require('./../src/server/liveqlConfig');

const test1 = { uid: 'test1', directive: 'test1' };
test('Test with uid and directive.', () => {
  liveql.setConfig(test1);
  expect(liveql.getConfig()).toEqual({ uid: 'test1', directive: '@test1' });
});

test('Test with no object.', () => {
  liveql.setConfig();
  expect(liveql.getConfig()).toEqual({ uid: 'id', directive: '@live'})
});

const test3 = { directive: '@live' };
test('Test with @ in directive', () => {
  liveql.setConfig(test3);
  expect(liveql.getConfig()).toEqual({ uid: 'id', directive: '@live' });
});