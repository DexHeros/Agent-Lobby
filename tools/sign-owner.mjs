#!/usr/bin/env node
/* DexHero lobby ownership proof helper.
 *
 * Produces the exact message your wallet must sign, then assembles
 * .dexhero/owner.json from the resulting signature. No private key ever
 * touches this script — you sign in your own wallet.
 *
 * Step 1 — print the message to sign:
 *     node tools/sign-owner.mjs <owner/repo> <0xWallet>
 *   Copy the message, sign it in MetaMask/Rabbit ("Sign Message" /
 *   personal_sign), and copy the 0x… signature.
 *
 * Step 2 — write the proof file:
 *     SIGNATURE=0x<sig> node tools/sign-owner.mjs <owner/repo> <0xWallet>
 *   Then: git add .dexhero/owner.json && git commit && git push
 *
 * The message format is the source-of-truth contract with the platform's
 * lib/lobby-register-fork.js ownershipMessage(). Keep them identical.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

function resolveRepo(arg) {
    if (arg) return arg;
    if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
    try {
        const url = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
        const m = url.match(/github\.com[:/]([^/]+\/[^/.]+)(?:\.git)?$/i);
        if (m) return m[1];
    } catch { /* not a git checkout */ }
    return '';
}

const repo   = resolveRepo(process.argv[2]);
const wallet = String(process.argv[3] || process.env.WALLET || '').toLowerCase();
const signature = process.env.SIGNATURE || process.argv[4] || '';

if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
    console.error('Usage: node tools/sign-owner.mjs <owner/repo> <0xWallet>');
    console.error('  (could not auto-detect the repo — pass it explicitly)');
    process.exit(1);
}
if (!/^0x[0-9a-f]{40}$/.test(wallet)) {
    console.error('Provide your wallet address: node tools/sign-owner.mjs ' + repo + ' 0x…');
    process.exit(1);
}

// MUST match lib/lobby-register-fork.js ownershipMessage().
const message = [
    'DexHero Lobby Registration',
    `Repository: ${repo.toLowerCase()}`,
    `Wallet: ${wallet}`,
].join('\n');

if (!signature) {
    console.log('\n── Sign THIS exact message in your wallet (personal_sign) ──\n');
    console.log(message);
    console.log('\n── Then run, with the 0x signature your wallet returns: ──\n');
    console.log(`  SIGNATURE=0x… node tools/sign-owner.mjs ${repo} ${wallet}\n`);
    process.exit(0);
}

if (!/^0x[0-9a-fA-F]{130}$/.test(signature)) {
    console.error('SIGNATURE must be a 0x-prefixed 65-byte (130 hex char) EIP-191 signature.');
    process.exit(1);
}

// Best-effort local verification if ethers happens to be installed.
try {
    const { ethers } = await import('ethers');
    const recovered = ethers.utils.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== wallet) {
        console.error(`Signature recovers to ${recovered}, not ${wallet}. Re-sign the exact message.`);
        process.exit(1);
    }
    console.log(`✓ Signature verified locally (recovers to ${wallet}).`);
} catch {
    console.log('(ethers not installed — skipping local verify; the platform will verify on push.)');
}

mkdirSync('.dexhero', { recursive: true });
writeFileSync('.dexhero/owner.json', JSON.stringify({ version: 1, wallet, signature }, null, 2) + '\n');
console.log('\n✓ Wrote .dexhero/owner.json');
console.log('  Next: git add .dexhero/owner.json && git commit -m "Claim my DexHero lobby" && git push');
