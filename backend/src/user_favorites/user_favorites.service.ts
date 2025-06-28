import { supabase } from '../lib/supabaseClient';
import { UserFavorite, CreateUserFavoriteRequest, UserFavoriteWithConcert } from './user_favorites.model';

export const addToFavorites = async (userId: string, concertId: string): Promise<UserFavorite> => {
  // 이미 찜한 공연인지 확인
  const { data: existingFavorite, error: checkError } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('concert_id', concertId)
    .maybeSingle();

  if (checkError) {
    throw new Error(`찜하기 확인 중 오류가 발생했습니다: ${checkError.message}`);
  }

  if (existingFavorite) {
    throw new Error('이미 찜한 공연입니다.');
  }

  // 공연이 존재하는지 확인
  const { data: concert, error: concertError } = await supabase
    .from('concerts')
    .select('id')
    .eq('id', concertId)
    .maybeSingle();

  if (concertError) {
    throw new Error(`공연 정보 확인 중 오류가 발생했습니다: ${concertError.message}`);
  }

  if (!concert) {
    throw new Error('존재하지 않는 공연입니다.');
  }

  // 찜하기 추가
  const { data: newFavorite, error: insertError } = await supabase
    .from('user_favorites')
    .insert({
      user_id: userId,
      concert_id: concertId
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`찜하기 추가 중 오류가 발생했습니다: ${insertError.message}`);
  }

  return newFavorite;
};

export const removeFromFavorites = async (userId: string, concertId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('concert_id', concertId);

  if (error) {
    throw new Error(`찜하기 삭제 중 오류가 발생했습니다: ${error.message}`);
  }
};

export const getUserFavorites = async (userId: string): Promise<UserFavoriteWithConcert[]> => {
  const { data: favorites, error } = await supabase
    .from('user_favorites')
    .select(`
      id,
      user_id,
      concert_id,
      created_at,
      concerts!inner (
        id,
        title,
        date,
        poster_url,
        organizer,
        main_performer,
        venue_id
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`찜한 공연 조회 중 오류가 발생했습니다: ${error.message}`);
  }

  // 장소 정보도 함께 가져오기
  const favoritesWithVenue = await Promise.all(
    favorites.map(async (favorite) => {
      let venueName = null;
      let venueAddress = null;

      if (favorite.concerts.venue_id) {
        const { data: venue } = await supabase
          .from('venues')
          .select('name, address')
          .eq('id', favorite.concerts.venue_id)
          .single();

        if (venue) {
          venueName = venue.name;
          venueAddress = venue.address;
        }
      }

      return {
        id: favorite.id,
        user_id: favorite.user_id,
        concert_id: favorite.concert_id,
        created_at: favorite.created_at,
        concert: {
          id: favorite.concerts.id,
          title: favorite.concerts.title,
          date: favorite.concerts.date,
          poster_url: favorite.concerts.poster_url,
          organizer: favorite.concerts.organizer,
          main_performer: favorite.concerts.main_performer,
          venue_name: venueName,
          venue_address: venueAddress
        }
      };
    })
  );

  return favoritesWithVenue;
};

export const checkIsFavorite = async (userId: string, concertId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('concert_id', concertId)
    .maybeSingle();

  if (error) {
    throw new Error(`찜하기 상태 확인 중 오류가 발생했습니다: ${error.message}`);
  }

  return !!data;
}; 