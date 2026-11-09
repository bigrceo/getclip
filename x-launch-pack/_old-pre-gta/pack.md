# CLIP — pack de lancement X (Solana)

Images dans `img/`, vidéo dans `video/`. Rien n'est posté.

## Ton
Calqué sur gif.fun (@LaunchOnGIF) : minuscules, une phrase par ligne, phrases courtes, aucun point d'exclamation, pas de fusée, un emoji max.
Mots bannis : yield, APY, passive income, guaranteed, 100x, moon, audited, investment, "up to", soon.
À la place : clip, coin, launch, paste, free, on us, live on pump.fun, creator fees, ends in clip.
Aucune date nulle part. Aucun chiffre inventé : seuls chiffres utilisés = 21 coins en ligne, ~0.006 SOL, 0 %.
Chaque texte d'image ≠ texte du tweet : l'image porte la punchline, le tweet l'autre angle.

## Profil (déjà décidé)
| Champ | Valeur |
|---|---|
| Nom | CLIP |
| Handle | @getclipfun (secours : @getclip_fun, @clipfunsol) |
| Bio (104 car.) | Any viral clip becomes a pump.fun coin. Paste a TikTok, Reel or X link. Free, no wallet. getclip.fun |
| Lien | https://getclip.fun |
| Localisation | Solana |
| Avatar | img/pfp.png |
| Bannière | img/x-banner.png (1500×500, coin bas gauche libre pour l'avatar) |
| Épinglé | l'article, puis le LIVE le soir du lancement |

## Ordre
1. Article (couverture `img/A0-cover.png`)
2. Vidéo how it works — `video/how-it-works.mp4`
3. Supply locked — `img/S1-locked.png` (remplir [lien du lock] ; ne pas poster tant que le lock n'existe pas)
4. DEX paid — `img/D1-dexpaid.png` (= T+10 ci-dessous)
5. Updates U1 → U5, une par demi-journée

---

## POST 1 — ARTICLE

Couverture : [image : img/A0-cover.png]

Titre : any viral clip is now a pump.fun coin

```
every day a clip breaks the internet.
a horse that hates pumpkins. a pug at an omakase. goats on a train platform.
millions of views. zero coins.

until now.

CLIP turns any viral clip into a pump.fun coin.
paste a tiktok, a reel, a short or an x video. that's the whole input.

[image : img/A1-how.png]

how it works

paste the link.
pick the square and the few seconds that loop.
name it.

your coin is created on pump.fun in one transaction.
it shows up on pump.fun and on every terminal at once.
its mint address ends in clip.

shortcut: put getclip.fun/ in front of any clip link and you land straight on the launch.

free. no wallet.

CLIP pays the launch, about 0.006 SOL, on us.
no wallet needed: paste the address the creator fees go to and you're done.
want the first buy? connect a wallet and it goes in the same transaction as the launch.

[image : img/A2-wall.png]

already live

21 clips are already coins on getclip.fun.
$OMAKASE. $GOATS. $WHALE. $MESSI. $HENRY. and the rest of the wall.
every one of them a real pump.fun coin, every mint ending in clip.

where the fees go

[image : img/A3-fees.png]

pump.fun pays a creator fee on every trade.
it goes to the launcher, or, if you pick it, to the holders, paid out by pump.fun itself.
CLIP takes 0%. no platform fee, no cut.

your funds never touch us.
buys and sells go from your wallet straight to pump.fun: bonding curve, then pumpswap once a coin graduates.

$CLIP

$CLIP is the coin of the platform itself.
the clip that launches clips.

the next viral clip is already posted somewhere.
make it a coin before anyone else does.

getclip.fun
```

---

## POST 2 — VIDÉO how it works
Fichier : `video/how-it-works.mp4` (15 s, 1080×1080, sans son)
```
paste. crop. coin.

that's the whole thing.

getclip.fun
```

## POST 3 — SUPPLY LOCKED
Image : `img/S1-locked.png`
```
dev supply is in a lock.
check it yourself, not our word:
[lien du lock]
```

## POST 4 — DEX PAID → voir T+10 ci-dessous (même texte, même image)

## U1 — le raccourci
Image : `img/U1-prefix.png`
```
saw a clip going viral?
don't copy anything.
tap the address bar, type getclip.fun/ before the link, hit enter.
you're on the launch screen with the clip loaded.
```

## U2 — ends in clip
Image : `img/U2-mint.png`
```
you can spot a CLIP coin from the contract alone.
every mint we launch ends in clip.
no lookalike, no confusion on the terminals.
```

## U3 — free
Image : `img/U3-free.png`
```
launching a coin from a clip costs you nothing.
we cover the creation on solana.
no wallet to connect, no seed phrase, no extension.
paste the clip, paste where the fees go, launch.
getclip.fun
```

## U4 — tiktok, reels, x
Image : `img/U4-feeds.png`
```
the feed is the launchpad.
tiktok, instagram reels, youtube shorts, x videos.
if it loops, it can be a coin.
```

## U5 — clip du jour
Image : `img/U5-omakase.png`
```
a pug sitting through a full omakase, unbothered.
now it trades on pump.fun.
one of the 21 clips already live on getclip.fun.
```

---

## HORS TIMELINE — soir du lancement, 10 min d'écart

### T+0 · LIVE — image `img/L1-live.png` (aucun ticker dans l'image) — épingler aussitôt
```
CLIP is live.

CA:

any viral clip, a pump.fun coin in one transaction.
free, no wallet, 0% to us.

getclip.fun
```

### T+10 · DEX PAID — image `img/D1-dexpaid.png`
```
dex screener paid ✅

CA:
```

---

## Récurrents
- Clip du jour : un coin réel lancé sur le site, son clip en image, une ligne sur le clip, le nom du coin. Jamais de prix.
- Quand un clip explose sur tiktok/x : répondre avec `getclip.fun/<lien du clip>`.
- Placeholders si besoin : `[x] coins launched`, `[x] SOL in creator fees` — seulement avec la donnée réelle.

## Fichiers
- compose.py → posts.html (tous les visuels), render.mjs → img/*.png
- video-src/ (Remotion) → video/how-it-works.mp4, brief : video/BRIEF.md
- logos/ : Solana, pump.fun, DEX Screener, TikTok, Instagram, X
