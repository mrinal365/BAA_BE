### TASK 4 - SYSTEM DESIGN: SCALING SEARCH

# 1 - Diagnosis and likely causes 
- Check backend logs and monitoring to understand P50, P85/P90/P95 latency and when the timeouts started.
- Check the database slow query log and use EXPLAIN on queries used by GET /artists/search.
- Check whether the endpoint has pagination and whether it is returning too many records.
- Check for N+1 queries or unnecessarily repeated database queries.
- Check the database connection pool for exhaustion or connection leaks.
- Check for any blocking synchronous code in the Node.js backend that could increase CPU usage.

- (most likely cause) Review the search query itself for unnecessary joins, sorting, or expensive operations. 
- (second most likely cause) Check whether caching exists and whether frequently repeated searches could be served from cache. 
- (third most likely cause) Check indexes, filtering, and sorting to see if database is doing full table scans. 



# 2 -What is your 48-hour fix?
- First, I would add indexes based on the actual search filters and sorting fields identified through EXPLAIN.

- Second, I would introduce redis for short-lived caching for frequently repeated artist searches. A  cache with a small TTL could prevent identical searches from repeatedly hitting database during peak traffic. TTL will be very small, like 10 minutes or 5 minutes. 


# 3. Long-Term Fix & Trade-offs
- The long-term solution would be making the search service independent and adding  Elasticsearch/OpenSearch, while keeping database as the source of truth.

- The trade-off is because the elastic search needs to be synced with database on new write and there might be slight delay between the database and elastic search, it will be eventual consistensy.  This situation will only be problematic when users search immediately after an update.


