# CLIP — vidéo how it works (brief v2)

Mécanique en 3 lignes :
1. Tu colles un lien TikTok, Reel, Short ou X (ou tu mets getclip.fun/ devant le lien).
2. Tu cadres le carré et la boucle de quelques secondes ; CLIP paie le lancement (~0,006 SOL), pas besoin de wallet.
3. Le coin sort sur pump.fun en une transaction, adresse finissant par « clip », 0 % pour CLIP, fees créateur au lanceur ou aux holders.

Storyboard (60 fps, 900 images) :
- 0–120 HOOK : « THAT CLIP? » claque, « IT'S A COIN. » monte en ressort.
- 120–300 SETUP : logos TikTok / Instagram / X, le lien se tape, « getclip.fun/ » se glisse devant.
- 300–420 BEAT 1 « crop the loop » : le carré jaune se resserre sur le vrai clip $HENRY, barre de boucle.
- 420–540 BEAT 2 « we pay the launch » : compteur Solana 0 → ~0.006 SOL, « no wallet ».
- 540–660 BEAT 3 « mint ends in clip » : la vraie adresse de $HENRY se décode, cLiP s'allume en rose ; logo pump.fun.
- 660–780 PAYOFF : mur des 21 vrais coins, « LIVE ON PUMP.FUN ».
- 780–900 END : wordmark CLIP.FUN, $CLIP, « any viral clip becomes a coin. », getclip.fun, tenu 1 s.
Transitions : volets roses obliques à chaque coupe. Fond indigo #14123a, trame de points, grain, halo rose. Bungee + Inter.

Sortie : video/how-it-works.mp4 — 1080×1080, 60 fps, 15,00 s, H.264, **sans piste audio**.
Source : video-src/src/index.tsx — `npx remotion render src/index.tsx HowItWorks ../video/how-it-works.mp4 --muted`
