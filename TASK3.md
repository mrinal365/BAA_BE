### TASK A - LEADERBOARD QUERY

The optimized SQL query aggregates reviews and completed bookings separately to avoid row multiplication issues.

SQL QUERY:

WITH artist_reviews AS (
    SELECT 
        artist_id,
        ROUND(AVG(score)::numeric, 2) AS avg_score,
        COUNT(id) AS review_count
    FROM reviews
    WHERE created_at >= NOW() - INTERVAL '90 days'
    GROUP BY artist_id
    HAVING COUNT(id) >= 5
),
artist_bookings AS (
    SELECT 
        artist_id,
        COUNT(id) AS completed_booking_count
    FROM bookings
    WHERE status = 'completed'
    GROUP BY artist_id
)
SELECT 
    a.name AS artist_name,
    a.category,
    r.avg_score AS average_score,
    r.review_count AS total_review_count,
    COALESCE(b.completed_booking_count, 0) AS total_completed_booking_count
FROM artists a
JOIN artist_reviews r ON a.id = r.artist_id
LEFT JOIN artist_bookings b ON a.id = b.artist_id
ORDER BY r.avg_score DESC, total_completed_booking_count DESC
LIMIT 10;


PERFORMANCE & SCALING ANSWERS:

1. Indexing Strategy:
- Index on reviews(created_at, artist_id, score): Allows index-only scans to filter dates and compute average scores directly without loading data rows from disk.
- Index on bookings(artist_id, status): Speeds up counting completed booking records.

2. At Large Scale (Millions of Rows):
- Caching: Cache results in Redis with a 5-15 minute TTL to serve searches from memory.
- Materialized Views: Store calculations inside a Materialized View refreshed periodically.
- Summary Tables: Pre-calculate metrics dynamically when bookings complete or reviews are saved.









### TASK B - SCHEMA AUDIT

Problem 1: Approximate Type for Financials (FLOAT)
- Issue: hourly_rate and amount use FLOAT.
- Impact: Causes floating-point rounding errors in calculations.
- Fix:
  ALTER TABLE artists ALTER COLUMN hourly_rate TYPE DECIMAL(10, 2);
  ALTER TABLE bookings ALTER COLUMN amount TYPE DECIMAL(10, 2);

Problem 2: Missing Foreign Keys
- Issue: No foreign keys linking bookings/reviews to parent tables.
- Impact: Allows orphaned records and broken relations.
- Fix:
  ALTER TABLE bookings ADD CONSTRAINT fk_bookings_artist FOREIGN KEY (artist_id) REFERENCES artists(id);
  ALTER TABLE reviews ADD CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) REFERENCES bookings(id);

Problem 3: Unconstrained Statuses
- Issue: bookings.status is unvalidated VARCHAR(50).
- Impact: Allows garbage data (like 'pendin') to enter the database.
- Fix:
  ALTER TABLE bookings ADD CONSTRAINT chk_bookings_status CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled'));

Problem 4: Redundant Denormalization
- Issue: reviews table contains both booking_id and artist_id.
- Impact: Violates 3NF. Booking tracks the artist already. Storing it twice risks data mismatch inconsistencies.
- Fix:
  ALTER TABLE reviews DROP COLUMN artist_id;

Problem 5: Missing Null Checks
- Issue: Key columns allow NULL values.
- Impact: Allows bookings without dates, reviews without scores, or artists without names.
- Fix:
  ALTER TABLE artists ALTER COLUMN name SET NOT NULL;
  ALTER TABLE bookings ALTER COLUMN event_start SET NOT NULL;
  ALTER TABLE bookings ALTER COLUMN event_end SET NOT NULL;
  ALTER TABLE reviews ALTER COLUMN score SET NOT NULL;
