import bcrypt from 'bcryptjs';

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (plain, hashed) => {
  if (!plain || !hashed) return false;
  return bcrypt.compare(plain, hashed);
};
