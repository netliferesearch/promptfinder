# Firefox Extension Development for DesignPrompts

This document outlines the complete Firefox development environment for the DesignPrompts extension.

## Quick Start

### Option 1: Use the Development Script (Recommended)

```bash
npm run dev:full
```

This runs the comprehensive development script that:

- Switches CSS to development mode
- Builds JavaScript in development mode
- Starts JavaScript file watcher
- Launches Firefox with the extension and developer tools

### Option 2: Manual Firefox Launch

```bash
npm run firefox:run
```

### Option 3: VS Code Debug Configurations

1. **Launch Firefox Extension** - Direct Firefox launch with debugging
2. **Launch Extension with web-ext** - Uses the web-ext task as pre-launch
3. **Attach to Firefox** - Attach to an already running Firefox instance

## Automatic Developer Tools

The configuration automatically opens:

- **Firefox Developer Tools** (`--devtools` flag)
- **Browser Console** (`--browser-console` flag)
- **JavaScript Console** (`--jsconsole` argument in launch.json)

## Configuration Files

### `.vscode/tasks.json`

- `web-ext:run` - Runs the extension with automatic developer tools
- `web-ext:build` - Builds the extension for distribution

### `.vscode/launch.json`

- Three debug configurations for different debugging scenarios
- All use Firefox Developer Edition
- Automatic developer tools opening configured

### `package.json` Scripts

- `firefox:run` - Launch Firefox with extension and dev tools
- `firefox:build` - Build extension package
- `dev:firefox` - Quick development start
- `dev:full` - Complete development environment
- `dev:watch` - Development with file watching

### Development Script: `scripts/dev-with-firefox.sh`

Comprehensive automation that:

1. Sets up CSS development environment
2. Builds JavaScript in development mode
3. Starts file watchers
4. Launches Firefox with all debugging tools
5. Manages cleanup on exit

## Firefox Developer Edition Path

All configurations use:

```
/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox
```

## Developer Tools Features

- **Automatic opening** of Firefox Developer Tools
- **Browser Console** for extension debugging
- **JavaScript Console** for script debugging
- **Extension debugging page** opens automatically
- **Auto-reload** on file changes
- **Profile persistence** across sessions

## Usage Tips

1. **Extension Reload**: Press `R` in the terminal to manually reload
2. **Stop Development**: Press `Ctrl+C` to stop all processes
3. **Debug Extension**: Use the automatically opened developer tools
4. **View Logs**: Check both browser console and terminal output
5. **Profile Changes**: Settings and data persist between sessions

## Troubleshooting

### Common Issues

- **Permission Warnings**: If you see warnings about unsupported permissions like `"windows"` or `"identity.email"`, these are Chrome-specific permissions that have been removed for Firefox compatibility
- If Firefox doesn't open, verify the path in configurations
- If developer tools don't open, check the `--devtools` and `--browser-console` flags
- For extension debugging issues, check the automatically opened debugging page
- If auto-reload fails, manually press `R` in the terminal

### Cross-Browser Compatibility

The extension manifest has been optimized for both Chrome and Firefox:

- Removed Chrome-specific `"windows"` permission
- Removed Firefox-incompatible `"identity.email"` permission
- All core functionality works across both browsers
