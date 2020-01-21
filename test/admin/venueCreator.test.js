const { exec } = require('child_process');

describe('Create Venue administration', () => {
  test('Evergreen, in-memory', async () => {
    let exitCode;
    await new Promise((resolve, reject) => {
      exec(
        'node src/admin/createVenue.js :memory: "Dive Bar" "17 Lake St"',
        (error, stdout, stderr) => {
          if (error) {
            exitCode = error;
            // eslint-disable-next-line no-console
            console.error('exit code', error);
            reject(stderr);
          } else {
            exitCode = 0;
            resolve(stdout);
          }
        },
      );
    }).catch(console.error); // eslint-disable-line no-console
    expect(exitCode).toBe(0);
  });
});
