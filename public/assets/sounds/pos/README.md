# POS barcode scan sound effects

Drop short audio files here. They are served at `/assets/sounds/pos/<filename>`.

| File | When it plays |
|------|----------------|
| `scan-success.mp3` | Barcode scanned and product added to cart |
| `scan-error.mp3` | Unknown barcode, out of stock, or stock limit |

**Tips**
- Keep clips under ~0.5s and under ~50 KB for fast POS response.
- MP3 is recommended; WAV also works if you update `SCAN_SOUND_URLS` in `src/lib/posScanFeedback.ts`.
- If files are missing, the app falls back to built-in beeps.
