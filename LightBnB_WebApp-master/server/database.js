const properties = require("./json/properties.json");
const users = require("./json/users.json");

const { Pool } = require("pg");
// let args = process.argv.splice(2);
// console.log(args);

// const values = [`%${args[0]}%`, args[1]];
const pool = new Pool({
  user: "vagrant",
  password: "123",
  host: "localhost",
  database: "lightbnb"
});

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
    .query(
      `
  SELECT * FROM users
  WHERE email= $1 
`,
      [email]
    )
    .then(res => res.rows[0]);
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query(
      `
  SELECT users.name FROM users
  WHERE id= $1;
`,
      [id]
    )
    .then(res => res.rows[0]);
};
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  return pool
    .query(
      `
    INSERT INTO USERS
    VALUES (DEFAULT, $1, $2, $3)
    RETURNING *;
    `,
      [user.name, user.email, user.password]
    )
    .then(res => res.rows)
    .catch(err => console.log(err));
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
    .query(
      `
  SELECT reservations.*, properties.*, avg(rating) FROM users
  JOIN reservations ON
  users.id=guest_id
  JOIN properties ON
  properties.id=reservations.property_id
  JOIN property_reviews ON
  properties.id=property_reviews.property_id
  WHERE end_date<now()::date and users.id=$1
  GROUP BY properties.id, reservations.id
  ORDER BY start_date
  LIMIT $2;
  `,
      [guest_id, limit]
    )
    .then(res => res.rows);

  // SELECT * FROM RESERVATIONS
  // WHERE GUEST_ID=$1
  // LIMIT $2;

  //return getAllProperties(null, 2);
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
    `;
  let queryParams = [];
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `and city LIKE $${queryParams.length} `;
  }
  if (options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night}`);
    queryString += `and cost_per_night >= $${queryParams.length} `;
  }
  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night}`);
    queryString += `and cost_per_night <= $${queryParams.length} `;
  }
  queryString.replace("and", "where");

  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;
  console.log(queryString, queryParams);
  return pool.query(queryString, queryParams).then(res => res.rows);
};
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  let values = [];
  let queryString = `
  INSERT INTO properties VALUES ($2, $3, $4, $5, $6, $7,$8, $9, $10, $11, $12, $13, $14, $1)
  RETURNING *
  `;

  console.log(property);
  for (let key in property) {
    values.push(property[key]);
    console.log(property[key]);
  }

  return pool
    .query(queryString, values)
    .then(res => res.rows)
    .catch(err => console.log(err));
};
exports.addProperty = addProperty;
