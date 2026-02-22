# Image conversion helper

Steps to convert images to WebP and update HTML to use WebP with fallback:

1. Install dependencies (requires Node.js and npm):

```powershell
npm install
```

2. Run the converter:

```powershell
npm run convert-images
```

What it does:
- Converts raster images (.png, .jpg, .jpeg, .gif) to `.webp` (quality 80) next to the original files.
- Scans all `.html` files and inserts a `<source type="image/webp" srcset="...">` before `<img>` tags (skips images referencing http(s) or data URIs and images already inside `<picture>`).

Notes:
- The script overwrites HTML files in-place; consider committing or backing up before running.
- If you prefer different quality or behavior, edit `scripts/convert-images.js`.
