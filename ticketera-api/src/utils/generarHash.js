const bcrypt = require('bcrypt');

async function main() {
  const password = 'Admin1234';
  const hash = await bcrypt.hash(password, 10);
  console.log('Hash generado:');
  console.log(hash);
}

main();