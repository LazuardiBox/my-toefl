# Auth Middleware Documentation

This document explains the logic and flow of the `authMiddleware` used in the application.

## Overview

The `authMiddleware` is responsible for determining the authentication status of a request. It sets the `auth` property in the context to either `"true"` or `"false"`.

The middleware is designed for **high performance** and **low latency** by eliminating external HTTP requests and leveraging database indexes.

## logical Flow

The middleware follows strict steps to validate a session:

1.  **Cookie Check**
    *   Inspects the request headers for the `cookie` header.
    *   If missing -> `auth = "false"`.

2.  **Local Token Extraction**
    *   Parses the cookie string locally using Regex.
    *   Target Cookie Name: `__Secure-better-auth.session_token`
    *   Regex: `/__Secure-better-auth\.session_token=([^;]+)/`
    *   If token is not found -> `auth = "false"`.

3.  **Database Validation (Optimized)**
    *   Performs a direct query to the local PostgreSQL database (`session` table).
    *   **Conditions**:
        1.  `token`: Matches the extracted token exactly.
        2.  `expiresAt`: Must be greater than the current time (`Date.now()`).
    *   **Optimization**:
        *   The query uses the **Unique Index** on the `token` column (O(1) / O(log n) lookup).
        *   It selects **only the `id` column** (`columns: { id: true }`) to minimize data transfer overhead.

4.  **Result**
    *   If a matching, non-expired session is found -> `auth = "true"`.
    *   Otherwise -> `auth = "false"`.

## Performance Features

*   **Zero External Latency**: No `fetch()` calls to external auth services. Logic is self-contained.
*   **Index Scan**: Uses the database's B-Tree index for immediate row retrieval.
*   **Minimal Payload**: Fetches strictly what is needed (existence check) rather than full user objects.
