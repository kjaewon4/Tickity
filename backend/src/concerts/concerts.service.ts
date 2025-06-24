import { Concert } from './concerts.model';

const concerts: Concert[] = [];

export const getAllConcerts = (): Concert[] => concerts;

export const createConcert = (concert: Concert): Concert => {
  concerts.push(concert);
  return concert;
}; 