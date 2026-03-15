# Application Icons

This application uses SVG-based icons for modern browser compatibility and scalability.

## Current Icons

✅ **Implemented Icons:**

- **favicon.svg** - Main favicon (SVG format, scalable)
- **apple-touch-icon.svg** - Apple touch icon (SVG format)

## Icon Design

The icons feature a chat bubble design with:

- **Dark bubble body** (#020617)
- **Blue circuit lines** (#38BDF8) representing AI/neural connectivity
- **Green node dots** (#22C55E) representing data points
- **Clean, modern aesthetic** that works at any size

## Source Files

Icon assets are located in `src/assets/`:

- **icon.svg** (256x256) - Standalone icon for favicons
- **logo.svg** (360x80) - Horizontal logo with "your-assistant" text

## How to Update Icons

### Option 1: Edit SVG Source Files

1. Modify `src/assets/icon.svg` for the icon design
2. Copy to public directory:

   ```bash
   cp src/assets/icon.svg public/favicon.svg
   cp src/assets/icon.svg public/apple-touch-icon.svg
   ```

3. Rebuild the project: `npm run build`

### Option 2: Use Different Format

If you prefer PNG icons for broader legacy support:

#### Using Online Tool

- Visit https://realfavicongenerator.net/
- Upload your icon (SVG or PNG)
- Download generated icon pack
- Extract PNG files to `/public` directory
- Update `index.html` to reference PNG files

#### Using ImageMagick

```bash
# Convert SVG to PNG favicons
convert src/assets/icon.svg -resize 16x16 public/favicon-16x16.png
convert src/assets/icon.svg -resize 32x32 public/favicon-32x32.png
convert src/assets/icon.svg -resize 180x180 public/apple-touch-icon.png
```

Then update `public/index.html`:

```html
<link rel="apple-touch-icon" sizes="180x180" href="<%= BASE_URL %>apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="<%= BASE_URL %>favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="<%= BASE_URL %>favicon-16x16.png">
```

## Browser Support

**SVG Icons** (current approach):

- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support
- ✅ Modern mobile browsers: Full support

**PNG Icons** (fallback option):

- ✅ All browsers including older versions
- ✅ Maximum compatibility

## Current Status

The application currently uses modern SVG icons that provide:

- **Scalability** - Perfect at any size
- **Small file size** - Optimized SVG format
- **Modern look** - Crisp on high-DPI displays
- **Easy maintenance** - Single source file

No 404 errors for icon files! 🎉
