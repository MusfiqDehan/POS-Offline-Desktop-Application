# Manual offline test matrix

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login with valid subdomain + POS user | Redirect to `/pos`, sync starts |
| 2 | Wait for sync | Products/customers available |
| 3 | Disable network | Offline banner appears |
| 4 | Scan known barcode | Product added from cache |
| 5 | Scan unknown code | Not-found status toast |
| 6 | Complete checkout offline | “Sale queued for sync”, receipt dialog |
| 7 | Re-enable network | Sync runs; outbox drained |
| 8 | Verify on server | Single sale (idempotency preserved) |
| 9 | Hold order offline | Persists across app restart |
| 10 | User without `pos` edit | `/access-denied` |
