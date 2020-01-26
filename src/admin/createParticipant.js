// Insert a new user into a sqlite3 db.
// Usage: DEBUG='*' node src/admin/createParticipant.js
// Options:
//   -n, --username <name>    User display name
//   -p, --password <secret>  Login password
//   -e, --email <email>      User email
//   -i, --id <unique-id>     Use id from shared identity DB
//   -s, --section <group>    Section name
//   -o, --organizer          Grant organizer priviledges
//   -h, --help               output usage information
//
// Reading from command line, and starting up db from scratch for one insert
// takes about 340ms on my laptop.
// Consider reading stdin....
const ParticipantCreator = require('./participantCreator.js');

const config = ParticipantCreator.parseCLI(process.argv);
const pc = new ParticipantCreator(config);

pc.setup().
  then(() => pc.createParticipant(config)).
  then(() => pc.close());
