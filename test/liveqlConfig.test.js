const liveql = require('./../src/server/liveqlConfig');

const test1 = { uid: 'test1', dirStr: 'test1' };
test('Test with uid and dirStr.', () => {
  liveql.setConfig(test1);
  expect(liveql.getConfig()).toEqual({ uid: 'test1', dirStr: '@test1' });
});

test('Test with no object.', () => {
  liveql.setConfig();
  expect(liveql.getConfig()).toEqual({ uid: 'id', dirStr: '@live'})
});

const test3 = { dirStr: '@live', noCtx: true };
test('Test with @ in directive', () => {
  liveql.setConfig(test3);
  expect(liveql.getConfig()).toEqual({ uid: 'id', dirStr: '@live', noCtx: true });
});