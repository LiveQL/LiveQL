const hash = require('./../src/liveql/queryHash');

/**
 * Mock query strings for testing.
 */
const test1 = `
  {
    Topics {
      content
      id
    }
  }
`;
const test2 = `
  query {
    Topics {
      content
      id
    }
  }
`;
const test3 = `
  query Testing{
    Topics {
      content
      id
    }
  }
`;
const test4 = `
  query Testing($id: ID!) {
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
const vars4 = { id: '5a9b26de4d33148fb6718928' };

const test5 = `
  query Testing($id: ID!, $name: String!) {
    Topic(id: $id) {
      id
      author

      comments(author: $name) {
        id
        author
        
      }
    }
  }
`;
const vars5 = { id: '5a9b26de4d33148fb6718928', name: 'Max' };

test('Hash with no variables', () => {
  expect(hash(test1)).toEqual('{Topics{contentid}}');
  expect(hash(test2)).toEqual('{Topics{contentid}}');
  expect(hash(test3)).toEqual('{Topics{contentid}}');
});

test('Hash with single variable', () => {
  expect(hash(test4, vars4)).toEqual('{Topic(id:5a9b26de4d33148fb6718928){idauthorcomments{idauthor}}}');
});

test('Hash with multiple variables', () => {
  expect(hash(test5, vars5)).toEqual('{Topic(id:5a9b26de4d33148fb6718928){idauthorcomments(author:Max){idauthor}}}');
});
