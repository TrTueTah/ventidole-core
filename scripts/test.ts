import * as bcrypt from 'bcryptjs';

async function hashPassword() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  console.log('Hashed password:', hashedPassword);
}

hashPassword();
