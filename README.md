# NORD BOUNCE — Web Edition

A playable HTML5 Canvas edition of **NORD BOUNCE**, by **KONHAGEN GAMES**.

## Play locally

Open `index.html` in a modern browser. No server, npm, framework, or build process is required.

## Publish on GitHub Pages

1. Create a new public repository on GitHub (for example, `nord-bounce`).
2. Upload **all contents of this folder into the repository root**, keeping `index.html`, `style.css`, `game.js`, and the `assets/` folder together. Do not upload only the ZIP file.
3. Open your repository's **Settings → Pages**.
4. In **Build and deployment**, choose **Deploy from a branch**. Select your `main` branch, folder `/(root)`, and click **Save**.
5. Your game will be published at `https://YOUR-USERNAME.github.io/nord-bounce/`. GitHub Pages may take a few minutes to publish.

## Included

- Responsive, mouse-and-touch playable HTML5 Canvas game
- 5 worlds × 20 levels = 100 levels with boss at 20, 40, 60, 80, 100
- Levels only unlock after every block is cleared; losses allow retry
- Endless mode
- First-impact dotted aim; second bounce requires Precision Aim power
- Freeze, Pulse, Double Damage and Precision Aim consumable power-ups, bought with in-game coins
- 24 original skins copied from the NORD BOUNCE iOS project
- Exclusive signature skins visibly separated from coin skins
- Shop, Missions & Worlds, reward objectives, light/dark theme
- Local save via `localStorage` (progress is per browser/device)

## Important web differences

This is a browser adaptation, **not an automatic Swift-to-JavaScript conversion**. Gameplay physics and level generation have been implemented anew in JavaScript and can differ from the iPhone version. The web edition has no Apple StoreKit payments, Game Center, or cloud sync. **Premium Signature items are preview-only; no real-money checkout is connected**, and premium skins cannot be bought with coins. This version has not been tested across all browsers or mobile devices.

## Files

- `index.html` — the web pages and layout
- `style.css` — responsive design
- `game.js` — complete browser logic and local save
- `assets/app-icon.png` — app icon
- `assets/skins/` — all 24 ball skins

## License

All game code and artwork supplied as part of this package for the NORD BOUNCE project under KONHAGEN GAMES. Ensure you have permission to publish any branding or artwork you upload.
