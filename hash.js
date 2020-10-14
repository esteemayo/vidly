const bcrypt = require('bcryptjs');

async function run() {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash('test1234', salt);
    console.log(salt);
    console.log(hashed);
}

run();