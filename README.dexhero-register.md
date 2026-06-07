# Claim your DexHero lobby from a direct GitHub fork

Forked this repo and want it live at `https://dexhero.com/lobby/<your-wallet>/`?
You don't need the website — prove you own the wallet and push.

1. Produce the ownership proof:
   ```bash
   node tools/sign-owner.mjs <your-fork-owner>/<repo> 0xYourWallet   # prints the message
   # sign that exact message in your wallet (personal_sign), then:
   SIGNATURE=0x… node tools/sign-owner.mjs <your-fork-owner>/<repo> 0xYourWallet
   ```
2. Enable Actions on your fork (Actions tab → "I understand … enable them").
3. Commit + push:
   ```bash
   git add .dexhero/owner.json && git commit -m "Claim my DexHero lobby" && git push
   ```

The bundled GitHub Action (`.github/workflows/dexhero-register.yml`) registers
your fork with the platform on every push — no secrets, no webhook.

Your edits to `/styles`, `/pages` and `/app` are yours. Security-critical code
(wallet, brain, auth) is always served by the platform, never from your fork,
and a locked-down CSP plus required brand anchors mean a fork can't inject
code — so claiming any fork is safe.
