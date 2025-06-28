export interface Venue {
  id: string;
  name: string;
  address: string;
  capacity?: number;
}

export interface CreateVenueRequest {
  name: string;
  address: string;
  capacity?: number;
}

export interface UpdateVenueRequest {
  name?: string;
  address?: string;
  capacity?: number;
} 