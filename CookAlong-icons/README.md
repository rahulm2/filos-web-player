# CookAlong app icons

Generated to match the visual style of the original `icon-maskable-512.png`,
with the wordmark replaced from **filos** to **CookAlong**.

- Background: `#4C3025` (dark brown)
- Wordmark: `#F5E8DC` (cream), DM Serif Display
- Tagline: `#AA8C7D` (muted dusty rose), Inter Medium, letter-spaced

The tagline `COOK TOGETHER` is only rendered at sizes ≥ 120 px where it stays
legible. Smaller icons show just `CookAlong` to avoid mush.

---

## iOS — `ios/AppIcon.appiconset/`

Drop this whole folder into Xcode. It already contains `Contents.json`, so
Xcode will pick it up as the app icon set automatically.

| File                        | Size  | Use                            |
|-----------------------------|-------|--------------------------------|
| Icon-App-1024x1024@1x.png   | 1024  | App Store                      |
| Icon-App-60x60@3x.png       | 180   | iPhone home screen             |
| Icon-App-60x60@2x.png       | 120   | iPhone home screen             |
| Icon-App-83.5x83.5@2x.png   | 167   | iPad Pro home screen           |
| Icon-App-76x76@2x.png       | 152   | iPad home screen               |
| Icon-App-76x76@1x.png       | 76    | iPad home screen (legacy)      |
| Icon-App-40x40 @1x/@2x/@3x  | 40/80/120 | Spotlight                  |
| Icon-App-29x29 @1x/@2x/@3x  | 29/58/87  | Settings                   |
| Icon-App-20x20 @1x/@2x/@3x  | 20/40/60  | Notification               |

---

## Android — `android/`

### Standard launcher icons — `android/res/mipmap-*/`

PNGs in each density bucket. Drop the whole `res/` folder into your Android
project (it merges with what's already there).

| Density   | Size  | Folder              |
|-----------|-------|---------------------|
| mdpi      | 48    | `mipmap-mdpi`       |
| hdpi      | 72    | `mipmap-hdpi`       |
| xhdpi     | 96    | `mipmap-xhdpi`      |
| xxhdpi    | 144   | `mipmap-xxhdpi`     |
| xxxhdpi   | 192   | `mipmap-xxxhdpi`    |

### Adaptive icon (Android 8.0+) — `android/res/drawable/` + `mipmap-anydpi-v26/`

- `drawable/ic_launcher_foreground.png` — wordmark on transparent, sized to
  Android's 66 % safe zone so launchers can mask to circle / squircle / leaf
  without clipping the text.
- `drawable/ic_launcher_background.png` — solid brown background.
- `mipmap-anydpi-v26/ic_launcher.xml` and `ic_launcher_round.xml` — the
  `<adaptive-icon>` definitions referencing the two drawables above.
- `values/ic_launcher_background.xml` — the brown color resource if you'd
  rather use a color than a PNG for the background (recommended).

If you want the lighter/cleaner setup, delete `ic_launcher_background.png`
and change the adaptive XML's `background` line to:
```xml
<background android:drawable="@color/ic_launcher_background" />
```

### Play Store listing — `android/play-store/playstore-icon-512.png`

512×512, no transparency, ready to upload to Play Console.

---

## PWA / web — `pwa/`

- `icon-192.png` and `icon-512.png` — standard `any` purpose icons.
- `icon-maskable-512.png` — `maskable` purpose icon, content sits inside
  the inner 80 % safe zone.

Reference in `manifest.webmanifest`:
```json
"icons": [
  { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
]
```
