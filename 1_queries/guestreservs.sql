SELECT reservations.*, properties.*, avg(rating) FROM users
JOIN reservations ON
users.id=guest_id
JOIN properties ON
properties.id=reservations.property_id
JOIN property_reviews ON
properties.id=property_reviews.property_id
WHERE end_date<now()::date and users.id='1'
GROUP BY properties.id, reservations.id
ORDER BY start_date
LIMIT 10;
