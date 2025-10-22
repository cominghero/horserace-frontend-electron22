# Creating Windows Application Icon

Your Electron app needs a proper `.ico` file for Windows. Currently, there's a placeholder at `build/icon.ico`.

## Quick Method (Online Tools)

### Option 1: ConvertICO (Recommended)
1. Create or find a square PNG image (256x256px or larger)
2. Go to https://convertio.co/png-ico/
3. Upload your PNG file
4. Download the generated `.ico` file
5. Replace `build/icon.ico` with your new icon

### Option 2: ICO Convert
1. Go to https://icoconvert.com/
2. Upload your image (PNG, JPG, SVG)
3. Select "Windows" format
4. Choose multi-size option (includes 16x16 to 256x256)
5. Download and replace `build/icon.ico`

## Recommended Icon Specifications

### Size Requirements:
- **Minimum:** 256x256 pixels
- **Recommended:** 512x512 pixels or larger (for high DPI displays)
- **Format:** Square (1:1 aspect ratio)

### Quality Guidelines:
- Use a simple, clear design (looks good at small sizes)
- Avoid fine details (may not be visible at 16x16)
- Use contrasting colors
- Test how it looks at different sizes

### Multi-Resolution ICO File Should Include:
- 16x16 (taskbar, file explorer)
- 32x32 (file explorer)
- 48x48 (file explorer large icons)
- 64x64 (Windows 10/11)
- 128x128 (high DPI)
- 256x256 (extra large icons)

## Design Ideas for Horse Racing App

Consider these icon themes:
1. Horse silhouette
2. Racing flag (checkered flag)
3. Horseshoe
4. Race track symbol
5. Trophy/medal
6. Jockey helmet
7. Horse head

## Free Icon Resources

### Download Pre-made Icons:
1. **Flaticon** - https://www.flaticon.com/
   - Search "horse racing"
   - Download as PNG
   - Convert to ICO

2. **Icons8** - https://icons8.com/
   - Search "horse" or "racing"
   - Download high resolution
   - Convert to ICO

3. **IconFinder** - https://www.iconfinder.com/
   - Free and paid options
   - High quality icons

### Create Custom Icon:
1. **Canva** - https://www.canva.com/
   - Free account
   - Create custom 512x512 design
   - Export as PNG
   - Convert to ICO

2. **Figma** - https://www.figma.com/
   - Free for personal use
   - Vector design
   - Export as PNG

## Desktop Icon Creator Software

### For Windows:

1. **IcoFX** (Free version available)
   - Full-featured icon editor
   - Create multi-resolution ICO files
   - http://icofx.ro/

2. **Greenfish Icon Editor Pro** (Free & Open Source)
   - Create/edit icons
   - Support for multiple sizes
   - https://greenfishsoftware.org/

3. **Paint.NET** + ICO Plugin (Free)
   - General image editor
   - Can save as ICO with plugin
   - https://www.getpaint.net/

## Testing Your Icon

After replacing the icon:

1. **Visual Test:**
   ```bash
   cd horseraceDashboard
   npm run electron:dev
   ```
   - Check taskbar icon
   - Check window title bar icon
   - Check Alt+Tab icon

2. **Build Test:**
   ```bash
   npm run electron:build:dir
   ```
   - Check icon in `release/win-unpacked/`
   - Right-click the .exe to see icon

## Current Placeholder

The current `build/icon.ico` is a placeholder file. You MUST replace it before building for production.

## After Creating Icon

1. Save your icon as `build/icon.ico`
2. Also save a copy as `public/icon.png` (for taskbar)
3. Rebuild the app
4. Test the icon appearance

## Example Workflow

```bash
# 1. Create icon (256x256 PNG)
# Use Canva, Figma, or download from Flaticon

# 2. Convert to ICO
# Use https://convertio.co/png-ico/

# 3. Replace placeholder
# Save as: horseraceDashboard/build/icon.ico

# 4. Also save PNG version
# Save as: horseraceDashboard/public/icon.png

# 5. Test
cd horseraceDashboard
npm run electron:dev

# 6. Build
npm run electron:build:win
```

## Icon Checklist

- [ ] Icon is 256x256 or larger
- [ ] Icon is square (1:1 aspect ratio)
- [ ] Icon saved as `build/icon.ico`
- [ ] PNG version saved as `public/icon.png`
- [ ] Icon tested in development mode
- [ ] Icon tested in built application
- [ ] Icon looks clear at small sizes (16x16)
- [ ] Icon is visible on light and dark backgrounds

## Troubleshooting

**Icon not showing:**
- Clear Windows icon cache
- Restart Windows Explorer
- Rebuild the application

**Icon looks blurry:**
- Use higher resolution source image
- Ensure ICO contains multiple sizes
- Use vector graphics if possible

**Wrong icon showing:**
- Delete old build in `release/` folder
- Clear Windows icon cache
- Rebuild completely

## Need Help?

If you need a custom icon designed:
1. Hire on Fiverr (starting $5)
2. Use AI generators (DALL-E, Midjourney)
3. Commission a designer

Remember: The icon is the first thing users see. Invest time in making it professional!
