# Icon Resizing Required

The current extension icons are all the same size (800x800 pixels), which is not optimal for a Chrome extension.

## Required sizes

- **icon16.png**: Should be 16x16 pixels (currently 800x800)
- **icon48.png**: Should be 48x48 pixels (currently 800x800)
- **icon128.png**: Should be resized to 128x128 pixels (currently 800x800)

## Why this matters

1. **Performance**: Smaller icons load faster and use less memory
2. **Display quality**: Each icon size is optimized for its particular use case
3. **Best practices**: Following Chrome extension guidelines ensures better compatibility

## How to resize

### Option 1: Using ImageMagick (command line)

```bash
cd /Users/tor-andershansen/Downloads/promptfinder
brew install imagemagick  # Install ImageMagick if not already available
convert icons/icon128.png -resize 16x16 icons/icon16.png
convert icons/icon128.png -resize 48x48 icons/icon48.png
convert icons/icon128.png -resize 128x128 icons/icon128.png
```

### Option 2: Using an image editor

Resize the existing icon using software like Photoshop, GIMP, or any online image editor to create properly sized versions.

### Option 3: Generate new icons

Consider using an icon generator like <https://favicon.io/> to create a proper icon set.

## Backup

The original icons have been backed up in the `/icons/backup/` directory.
