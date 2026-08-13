const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password || password.length < 10) {
  console.error('Uso: npm run admin:hash -- "uma-senha-forte-com-10-ou-mais-caracteres"');
  process.exit(1);
}

bcrypt.hash(password, 12)
  .then(hash => console.log(hash))
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  });
