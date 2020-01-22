const VenueCreator = require('../../src/admin/venueCreator');

describe('Create Venue administration', () => {
  test('In-memory create', async () => {
    const venueName = 'Some Dive Bar';
    const venueAddress = 'Don\'t Ask';
    const vc = new VenueCreator(':memory:');
    await vc.run(venueName, venueAddress);
    const results = await vc.server.timekeeper.getVenues();
    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual(venueName);
    expect(results[0].address).toEqual(venueAddress);
    return vc.close();
  });
});
