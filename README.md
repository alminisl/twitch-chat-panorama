# Twitch Chat Panorama

A browser extension for Chrome and Firefox that lets you move the Twitch chat below the video instead of side-by-side.

## Features

- Toggle between side-by-side and panorama (below video) chat layouts
- Settings persist across sessions
- Works on all Twitch stream pages
- Smooth transition animations
- Responsive design

## Installation

### Generate Icons First

Before loading the extension, you need to generate the icon files:

1. Open `icons/generate-icons.html` in your browser
2. Click the download links for each icon size (16x16, 48x48, 128x128)
3. Save them in the `icons` folder as:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

### Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select the `twitch-chat-panorama` folder

### Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Select any file in the `twitch-chat-panorama` folder (e.g., `manifest.json`)

**Note:** For permanent Firefox installation, you'll need to sign the extension through [Mozilla's Add-on Developer Hub](https://addons.mozilla.org/developers/).

## Usage

1. Navigate to any Twitch stream page (e.g., `twitch.tv/channelname`)
2. Click the extension icon in your browser toolbar
3. Toggle "Panorama Mode" on/off or click the layout previews
4. The chat will move below the video when panorama mode is enabled

## Keyboard Shortcut (Optional)

You can also toggle the layout by opening the browser console and running:

```javascript
window.twitchChatPanorama.toggle()
```

## Customization

You can adjust the chat height by modifying the CSS variable in `styles.css`:

```css
body.twitch-chat-panorama-enabled {
  --chat-panorama-chat-height: 350px; /* Change this value */
}
```

## Troubleshooting

### Extension doesn't work on some pages

- Make sure you're on a Twitch stream page (not clips, videos, or directory)
- Try refreshing the page after enabling the extension

### Layout looks broken

- Twitch frequently updates their CSS class names
- If the extension stops working after a Twitch update, please open an issue

### Icons don't appear

- Make sure you've generated the PNG icons using `icons/generate-icons.html`

## File Structure

```
twitch-chat-panorama/
├── manifest.json      # Extension manifest
├── content.js         # Content script for Twitch pages
├── styles.css         # CSS for layout transformation
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic
├── icons/
│   ├── icon.svg       # Source SVG icon
│   ├── icon16.png     # 16x16 icon (generate this)
│   ├── icon48.png     # 48x48 icon (generate this)
│   ├── icon128.png    # 128x128 icon (generate this)
│   └── generate-icons.html  # Icon generator tool
└── README.md          # This file
```

## License

MIT License - feel free to modify and distribute.

## Contributing

Contributions are welcome! If Twitch updates break the extension, feel free to submit a PR with fixes.
