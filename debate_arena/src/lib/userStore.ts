import bcrypt from "bcryptjs";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string; // hashed
};

export const users: User[] = []; 