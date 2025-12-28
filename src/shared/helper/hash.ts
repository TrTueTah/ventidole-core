import * as bcrypt from 'bcryptjs';

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string,
) => {
  const hashed = await bcrypt.hash(password, 10);
  console.log('password', password, hashed);
  return await bcrypt.compare(password, hashedPassword);
};
