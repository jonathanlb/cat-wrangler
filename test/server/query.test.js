const Query = require('../../src/server/query');

// Do we need to sort the query terms for testing, reproducibility?
describe('Query parsing', () => {
  test('Handles conjunctive where queries', () => {
    expect(Query.simpleWhere({ address: 'Row', name: 'Frodo' })).
      toEqual('WHERE address LIKE \'%Row%\' AND name LIKE \'%Frodo%\'');
  });

  test('Handles conjunctive where queries with id', () => {
    expect(Query.simpleWhere({ addressId: 14, name: 'Frodo' })).
      toEqual('WHERE addressId=14 AND name LIKE \'%Frodo%\'');
  });

  test('Handles empty where queries', () => {
    expect(Query.simpleWhere({})).toEqual('');
  });

  test('Handles id where queries', () => {
    expect(Query.simpleWhere({ id: 37 })).toEqual('WHERE id=37');
  });

  test('Handles like where queries', () => {
    expect(Query.simpleWhere({ name: 'Frodo' })).
      toEqual('WHERE name LIKE \'%Frodo%\'');
  });

  test('Handles undefined where queries', () => {
    expect(Query.simpleWhere()).toEqual('');
  });
});
