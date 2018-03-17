const liveConfig = require('./../src/server/liveqlConfig');

const test1 = { uid: 'test1', directive: 'test1' };
test('Test with uid and directive.', () => {
  liveConfig.set(test1);
  expect(liveConfig.get()).toEqual({ uid: 'test1', directive: '@test1' });
});

test('Test with no object.', () => {
  liveConfig.set();
  expect(liveConfig.get()).toEqual({ uid: 'id', directive: '@live'});
});

const test3 = { directive: '@live', retrieve: 'test' };
test('Test with @ in directive', () => {
  liveConfig.set(test3);
  expect(liveConfig.get()).toEqual({ uid: 'id', directive: '@live', retrieve: 'test' });
});