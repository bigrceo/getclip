# Kit pump.fun — CLIP · Leonida

| Champ | Valeur |
|---|---|
| Nom | `CLIP` |
| Ticker | `CLIPS` (`$CLIP` est déjà pris sur Solana par des coins morts : CLIP4FUN, CLIPBACK, ~2 K$) — secours : `VICECLIP` |
| Image | `img/pumpfun-logo.png` (1000×1000) |
| Site | `https://getclip.fun` |
| X | `https://x.com/getclipfun` (compte à créer avant) |
| Telegram | vide |

Description (à coller) :
```
Every GTA 6 clip becomes a coin. Paste a TikTok or X clip from Leonida, drop it on the map, and it launches on pump.fun. Free, no wallet. getclip.fun
```

Après le lancement :
- mettre le mint dans `src/lib/brand.ts` → `OFFICIAL_MINT = "…"` puis redéployer (`npx vercel --prod`) : le site affiche alors « Buy $CLIPS » + le CA.
- garder le sac dev.

## Wallet plateforme (à financer par toi)
`3BsvKjsTcuSVb2yNhqmeUsRTFtcQJAFwXcZAuoaRYdb1` — solde 0 SOL au 09/11.
Coût mesuré par lancement (simulation mainnet du create_v2) : **0,0055 SOL** (rent + frais).
- test seul : 0,01 SOL
- ouverture : **0,3 SOL ≈ 50 lancements** (recommandé pour le jour J), 1 SOL ≈ 180.
- limite : 5 lancements / IP / jour ; 40 mints `…gta6` libres dans le pool (`npm run grind -- --suffix gta6` pour en refaire).

## Test mainnet dès que le wallet est financé
getclip.fun/launch → drop une vidéo (ou lien X/TikTok) → carré → Map → nom/ticker → adresse des fees → Launch.
Attendu : coin sur pump.fun avec un mint finissant par `gta6`, pin à l'endroit choisi sur la map.
Testé le 09/11 sans SOL : upload Blob, rendu, mint réservé, metadata, transaction construite → refus « Not enough SOL » à l'envoi (normal). Simulation create_v2 mainnet : OK, 99 k CU.
