import { newDbClient } from './libs/database';
import { success, failure } from './libs/httpResponse';

export const getPlace = async (event, context, callback) => {
  const { placeId } = event.pathParameters;
  if (!placeId) {
    callback(null, failure(400, {
      msg: 'Please provide place id!',
    }));
    return;
  }

  const dbClient = newDbClient();
  try {
    await dbClient.connect();
    const resPlace = await dbClient.query(`
      SELECT
        places.id as id,
        places.created_at as created_at,
        places.updated_at as updated_at,
        place_subregions.name as subregion_name,
        place_regions.name as region_name,
        place_provinces.name as province_name,
        place_types.title as type_title,
        places.name as name,
        rating,
        banner_image_url,
        image_url_array,
        about,
        contact,
        latitude,
        longitude,
        address,
        price_min,
        price_max,
        open_hours
      FROM places INNER JOIN place_subregions ON places.subregion_id = place_subregions.id
        INNER JOIN place_regions ON place_subregions.region_id = place_regions.id
        INNER JOIN place_provinces ON place_regions.province_id = place_provinces.id
        INNER JOIN place_types ON places.type_id = place_types.id
      WHERE places.id = $1
    `, [placeId]);

    const resReviews = await dbClient.query(`
      SELECT
        id,
        title,
        author_name,
        site_name,
        site_url
      FROM place_external_reviews
      WHERE place_id = $1
    `, [placeId]);

    callback(null, success({
      place: resPlace.rows[0] || null,
      reviews: resReviews.rows[0] ? resReviews.rows : null,
    }));
  } catch (err) {
    console.log('Error: getPlace', err);
    callback(null, failure(500, {
      msg: 'Oops, Something went wrong! Please try again',
    }));
  } finally {
    await dbClient.end();
  }
};
