# Downloads & Installation

Get Your Assistant desktop app up and running on your computer.

## 🎁 Quick Download

**Latest Release:** [github.com/gma/your-assistant/releases](https://github.com/gma/your-assistant/releases)

| Platform | Download | Size | Type |
|----------|----------|------|------|
| ![macOS](https://img.shields.io/badge/macOS-11+-blue) | `Your Assistant-0.1.0-arm64.dmg` | ~140 MB | DMG Installer |
| ![Windows](https://img.shields.io/badge/Windows-10%2B11-blue) | `Your Assistant-0.1.0-setup.exe` | ~145 MB | NSIS Installer |
| ![Linux](https://img.shields.io/badge/Linux-x64-blue) | `Your-Assistant-0.1.0.AppImage` | ~150 MB | Universal Binary |

---

## 📋 System Requirements

### macOS

- **OS Version:** macOS 11 (Big Sur) or later
- **Architecture:** Apple Silicon (M1, M2, M3, M4)
- **RAM:** 4 GB minimum, 8 GB recommended
- **Disk Space:** 200 MB free space
- **Note:** Intel Macs not currently supported

### Windows

- **OS Version:** Windows 10 or Windows 11
- **Architecture:** x64 (64-bit)
- **RAM:** 4 GB minimum, 8 GB recommended
- **Disk Space:** 200 MB free space

### Linux

- **Distributions:** Ubuntu 20.04+, Debian 11+, Fedora 35+, or similar
- **Architecture:** x64 (64-bit)
- **RAM:** 4 GB minimum, 8 GB recommended
- **Disk Space:** 200 MB free space
- **Dependencies:** Most distributions include required dependencies automatically

---

## 🖥️ macOS Installation

### Method 1: DMG Installer (Recommended)

1. **Download:** `Your Assistant-0.1.0-arm64.dmg` from [GitHub Releases](https://github.com/gma/your-assistant/releases)
2. **Open:** Double-click the downloaded `.dmg` file
3. **Install:** Drag "Your Assistant" to the Applications folder
4. **Launch:** Open Applications folder and double-click "Your Assistant"
5. **First Launch:** You may see a warning about unidentified developer
   - Right-click the app and select "Open"
   - Or go to System Preferences → Security & Privacy → General → "Open Anyway"

### Method 2: ZIP Archive

1. **Download:** `Your Assistant-0.1.0-arm64.zip` from [GitHub Releases](https://github.com/gma/your-assistant/releases)
2. **Extract:** Double-click to unzip
3. **Move:** Drag "Your Assistant.app" to Applications
4. **Launch:** Open from Applications folder

### Uninstall

```bash
# Quit the app first
rm -rf /Applications/Your Assistant.app

# Optional: Remove app data
rm -rf ~/Library/Application\ Support/Your Assistant
rm -rf ~/Library/Preferences/com.yourassistant.app.plist
```

---

## 🪟 Windows Installation

### Method 1: NSIS Installer (Recommended)

1. **Download:** `Your Assistant-0.1.0-setup.exe` from [GitHub Releases](https://github.com/gma/your-assistant/releases)
2. **Run:** Double-click the installer
3. **Install Path:** Accept default (C:\Users\<username>\AppData\Local\Programs\your-assistant)
4. **Shortcuts:** Choose to create desktop and/or Start Menu shortcuts
5. **Launch:** Use desktop shortcut or Start Menu

### Method 2: Portable ZIP

1. **Download:** `Your Assistant-0.1.0-portable.zip` from [GitHub Releases](https://github.com/gma/your-assistant/releases)
2. **Extract:** Unzip to any folder
3. **Run:** Double-click `Your Assistant.exe`
4. **No Installation Required:** Fully portable, can run from USB drive

### Uninstall

```cmd
# Via Settings
Settings → Apps → Your Assistant → Uninstall

# Or manually
rmdir /s "%LOCALAPPDATA%\Your Assistant"
rmdir /s "%APPDATA%\Your Assistant"
```

---

## 🐧 Linux Installation

### AppImage (Universal - Recommended)

1. **Download:** `Your-Assistant-0.1.0.AppImage` from [GitHub Releases](https://github.com/gma/your-assistant/releases)
2. **Make Executable:**
   ```bash
   chmod +x Your-Assistant-0.1.0.AppImage
   ```
3. **Run:**
   ```bash
   ./Your-Assistant-0.1.0.AppImage
   ```

4. **Optional: Install System-Wide**
   ```bash
   sudo mv Your-Assistant-0.1.0.AppImage /opt/your-assistant
   sudo ln -s /opt/your-assistant/Your-Assistant-0.1.0.AppImage /usr/local/bin/your-assistant
   your-assistant  # Run from anywhere
   ```

### DEB Package (Debian/Ubuntu)

1. **Download:** `your-assistant_0.1.0_amd64.deb` from [GitHub Releases](https://github.com/gma/your-assistant/releases)
2. **Install:**
   ```bash
   sudo dpkg -i your-assistant_0.1.0_amd64.deb
   sudo apt-get install -f  # Install dependencies if needed
   ```
3. **Launch:** From Applications menu or terminal:
   ```bash
   your-assistant
   ```

### Uninstall (Linux)

```bash
# If installed via AppImage - just delete the file
rm Your-Assistant-*.AppImage

# If installed system-wide
sudo rm /opt/your-assistant/Your-Assistant-*.AppImage
sudo rm /usr/local/bin/your-assistant

# If installed via DEB
sudo apt-get remove your-assistant
```

---

## ✅ Verification

After installation, verify the app is working:

1. **Launch the application**
2. **Check for updates:** Should prompt on first launch
3. **Configure AI Provider:**
   - Go to Settings → AI Provider
   - Select OpenRouter (recommended) or any provider
   - Enter API key
   - Click "Test Connection"
4. **Test Microphone:**
   - Go to Settings → Speech Recognition
   - Select Web Speech API (free)
   - Click "Test Connection"
5. **Start Session:** Click "Start Session" button

---

## 🔄 Updates

### Automatic Updates (Not Implemented)

Automatic updates are not yet implemented. Check for new releases manually:

1. Visit [GitHub Releases](https://github.com/gma/your-assistant/releases)
2. Download the latest version
3. Install over existing version (your settings are preserved)

### Check Current Version

**In App:**
- Go to Settings → About
- Version number displayed

**In Terminal:**
```bash
# macOS
/usr/bin/MyAssistant --version

# Windows
"C:\Program Files\Your Assistant\Your Assistant.exe" --version

# Linux
your-assistant --version
```

---

## 🐛 Troubleshooting

### macOS

**"App is damaged and can't be opened"**
- This is a Gatekeeper issue with unsigned apps
- **Solution:** Right-click → Open, or run in terminal:
  ```bash
  xattr -cr /Applications/Your\ Assistant.app
  open /Applications/Your\ Assistant.app
  ```

**"App won't launch on Intel Mac"**
- Current builds are Apple Silicon only
- **Solution:** Use the web version at https://your-assistant.github.io

### Windows

**"Windows Defender SmartScreen prevented app from opening"**
- **Solution:** Click "More info" → "Run anyway"

**"MSVCP140.dll is missing"**
- **Solution:** Install [Microsoft Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe)

### Linux

**"Permission denied" when running AppImage**
- **Solution:** Make it executable:
  ```bash
  chmod +x Your-Assistant-*.AppImage
  ```

**"FATAL:electron failed to install correctly"**
- **Solution:** Install missing dependencies:
  ```bash
  # Ubuntu/Debian
  sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 libxrandr2 libasound2 libatspi2.0 libgbm1 libpango-1.0-0 libatk1.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrender1 libgconf-2-4 libxext6
  ```

---

## 📦 Build from Source

Prefer to build yourself? See:

- **[Development Guide](./DEVELOPMENT_GUIDE.md)** - Complete build instructions
- **[GitHub Actions Build](./GITHUB_ACTIONS_BUILD.md)** - CI/CD pipeline documentation

**Quick Start:**

```bash
git clone https://github.com/gma/your-assistant.git
cd your-assistant
npm install

# Build for current platform
npm run electron:build

# Output in release/ folder
```

---

## 🌐 Web Version

Don't want to install? Use the web version:

**Online:** https://your-assistant.github.io

**Features:**
- ✅ All desktop features except:
  - No global shortcuts (browser limitations)
  - No screenshot capture (browser security)
  - No always-on-top overlay
- ✅ Works on any device with a browser
- ✅ No installation required

---

## 📞 Support

Having issues?

- **[FAQ](./FAQ.md)** - Common questions
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Fix common issues
- **[GitHub Issues](https://github.com/gma/your-assistant/issues)** - Report bugs or request features

---

## 📜 License

Apache License 2.0

**Privacy Note:** Your Assistant respects your privacy. All API keys and configuration are stored locally on your device. Data is only sent to your chosen AI/transcription providers.
