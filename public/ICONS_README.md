# Icon Generation Instructions

The following icon files are referenced in `index.html` and `manifest.json` but need to be created:

## Required Icons

1. **favicon-16x16.png** (16x16 pixels)
2. **favicon-32x32.png** (32x32 pixels)  
3. **apple-touch-icon.png** (180x180 pixels)

## How to Generate Icons

### Option 1: Use an Online Tool
- Visit https://realfavicongenerator.net/
- Upload your logo/icon (ideally 512x512 PNG)
- Download the generated icon pack
- Place the files in the `/public` directory

### Option 2: Use ImageMagick (Command Line)
```bash
# Install ImageMagick first
# brew install imagemagick (macOS)
# apt-get install imagemagick (Linux)

# Convert from a source image (e.g., logo.png)
convert logo.png -resize 16x16 public/favicon-16x16.png
convert logo.png -resize 32x32 public/favicon-32x32.png
convert logo.png -resize 180x180 public/apple-touch-icon.png
```

### Option 3: Use Existing Logo
If you have `src/assets/logo.png`, you can use it as a starting point:
```bash
cd public
convert ../src/assets/logo.png -resize 16x16 favicon-16x16.png
convert ../src/assets/logo.png -resize 32x32 favicon-32x32.png
convert ../src/assets/logo.png -resize 180x180 apple-touch-icon.png
```

## Temporary Workaround
Until you generate proper icons, the app will work fine - browsers will just show default icons.
The references won't cause errors, just 404s in the console.

## Recommended Icon Design
- Simple, recognizable design
- High contrast
- Works well at small sizes
- Represents "interview" or "AI assistant" concept
- Use brand color (#409eff blue)
