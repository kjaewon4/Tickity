export interface UserFavorite {
  id: string;
  user_id: string;
  concert_id: string;
  created_at: string;
}

export interface CreateUserFavoriteRequest {
  concert_id: string;
}

export interface UserFavoriteWithConcert extends UserFavorite {
  concert: {
    id: string;
    title: string;
    date: string;
    poster_url?: string;
    organizer: string;
    main_performer: string;
    venue_name?: string;
    venue_address?: string;
  };
} 