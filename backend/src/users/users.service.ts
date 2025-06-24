import { User } from './users.model';

const users: User[] = [];

export const getAllUsers = (): User[] => users;

export const createUser = (user: User): User => {
  users.push(user);
  return user;
}; 