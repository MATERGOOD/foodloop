import jwt from "jsonwebtoken";

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
  }
  return secret;
};

export const generateToken = (payload, expiresIn = "7d") => {
  return jwt.sign(payload, getSecret(), { expiresIn });
};

export const generateUserToken = (user) => {
  return generateToken({
    id: user._id,
    role: user.role
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, getSecret());
};
