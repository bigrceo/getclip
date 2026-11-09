#!/usr/bin/env python3
"""Builds posts.html (every visual of the pack as a div with an id). render.mjs screenshots them."""
import json, re, pathlib
D = pathlib.Path(__file__).parent
clips = json.load(open(D.parent / "batch/clips.json"))
by = {c["ticker"]: c for c in clips}

def svg(name, color="#fff", size=56):
    s = (D / "logos" / f"{name}.svg").read_text()
    s = re.sub(r"<\?xml.*?\?>|<!--.*?-->", "", s, flags=re.S)
    s = s.replace("<svg", f'<svg style="width:{size}px;height:{size}px;fill:{color};flex:none"', 1)
    return s

def img(name, size=56, r=12):
    return f'<img src="logos/{name}" style="width:{size}px;height:{size}px;border-radius:{r}px;flex:none">'

SOL = lambda s=40: f'<img src="logos/sol.svg" style="width:{s}px;height:{s*0.78:.0f}px;flex:none">'
TT = lambda s=56: svg("tiktok", "#fff", s)
IG = lambda s=56: svg("instagram", "#fff", s)
XX = lambda s=56: svg("x", "#fff", s)
PF = lambda s=56: img("pumpfun.png", s, s // 4)
DX = lambda s=56: img("dex.png", s, s // 5)

def still(t):
    c = by[t]
    cy = c["crop"]["y"]
    h = c["video"]["h"]; w = c["video"]["w"]
    pos = 50 if h <= w else min(100, cy / max(1e-6, 1 - w / h) * 100)
    return f'../batch/{c["still"].split("batch/")[1]}', pos

def tile(t, size=200, label=True, rot=0, mint=False):
    src, pos = still(t)
    m = by[t]["mint"]
    lab = f'<div class="tk">${t}</div>' if label else ""
    mt = f'<div class="mt">{m[:4]}…{m[-8:-4]}<b>{m[-4:]}</b></div>' if mint else ""
    return (f'<div class="tile" style="width:{size}px;transform:rotate({rot}deg)">'
            f'<div class="ph" style="height:{size}px;background-image:url({src});background-position:50% {pos:.0f}%"></div>{lab}{mt}</div>')

def foot(extra=""):
    return (f'<div class="foot"><img src="logos/logo-wordmark.png" class="wm"><span class="dom">getclip.fun</span>'
            f'<span class="sp"></span>{extra}<span class="chain">{SOL(34)} Solana</span><span class="chain">{PF(34)} pump.fun</span></div>')

CSS = """
@font-face{font-family:Bungee;src:url(Bungee-Regular.ttf)}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#000;font-family:Inter,sans-serif;color:#fff}
.card{position:relative;width:1600px;height:900px;overflow:hidden;background:#14123a;display:flex;flex-direction:column;padding:64px 80px 54px}
.card:before{content:"";position:absolute;inset:0;background-image:radial-gradient(#322e78 1.6px,transparent 1.8px);background-size:14px 14px;opacity:.55}
.card>*{position:relative}
.glow{position:absolute!important;border-radius:50%;filter:blur(120px);opacity:.5}
.lab{font:700 22px Inter;letter-spacing:.12em;text-transform:uppercase;color:#ffcc00}
.mid{flex:1;display:flex;align-items:center;gap:60px}
h1{font:400 112px/0.98 Bungee;letter-spacing:-.01em;text-shadow:6px 6px 0 #0b0a24}
h1 .p{color:#ff3399}h1 .y{color:#ffcc00}h1 .c{color:#00ccff}h1 .g{color:#66ff99}
.body{font:500 30px/1.4 Inter;color:#a7a3e0;margin-top:26px;max-width:720px}
.foot{display:flex;align-items:center;gap:22px;border-top:2px solid #322e78;padding-top:24px;font:600 26px Inter}
.foot .wm{height:40px}.foot .dom{color:#00ccff;font-family:Bungee;font-size:26px}.foot .sp{flex:1}
.chain{display:flex;align-items:center;gap:10px;color:#fff}
.tile{background:#1c1a4d;border:4px solid #0b0a24;box-shadow:8px 8px 0 #ff3399;flex:none}
.ph{background-size:cover}
.tk{font:400 26px Bungee;padding:8px 12px 6px;color:#fff}
.mt{font:600 20px Inter;color:#a7a3e0;padding:0 12px 10px}.mt b{color:#ff3399}
.wall{display:grid;gap:18px;zoom:1.0}
.wall .tile{box-shadow:5px 5px 0 #ff3399}
.wall .tk{font-size:19px;padding:6px 8px 4px}
.slab{position:absolute!important;background:#ff3399}
.row{display:flex;align-items:center;gap:18px}
.big{font:400 64px Bungee}
.box{background:#1c1a4d;border:4px solid #0b0a24;box-shadow:8px 8px 0 #ffcc00;padding:28px 34px}
"""

cards = {}

# ---------- ARTICLE COVER 5:2 (1500x600)
wall_t = ["OMAKASE", "GOATS", "WHALE", "MESSI", "HENRY", "OTTER", "PUPS", "GLASS", "HUG", "CATS", "COLD", "UNICORN"]
cards["A0-cover"] = (1500, 600, f"""
<div class="card" style="width:1500px;height:600px;padding:60px 70px">
 <div class="slab" style="right:-120px;top:-60px;width:820px;height:760px;transform:rotate(-8deg)"></div>
 <div style="position:absolute;right:30px;top:40px;display:grid;grid-template-columns:repeat(4,160px);gap:22px;transform:rotate(-8deg)">
  {''.join(tile(t,160) for t in wall_t)}
 </div>
 <div style="display:flex;flex-direction:column;justify-content:center;height:100%;max-width:700px">
  <img src="logos/logo-wordmark.png" style="height:70px;align-self:flex-start">
  <h1 style="font-size:84px;margin-top:34px">any viral clip.<br><span class="p">a pump.fun</span><br><span class="y">coin.</span></h1>
  <div class="row" style="margin-top:30px;gap:22px">{TT(44)}{IG(44)}{XX(44)}<span style="font:400 30px Bungee;color:#00ccff;margin-left:8px">getclip.fun</span></div>
 </div>
</div>""")

# ---------- A1: how (paste / crop / launch)
cards["A1-how"] = (1600, 900, f"""
<div class="card"><div class="glow" style="background:#ff3399;width:600px;height:600px;left:500px;top:200px"></div>
 <div class="lab">three moves</div>
 <div class="mid" style="justify-content:space-between;gap:30px">
  <div style="width:430px">
   <div class="big" style="color:#ff3399">1 paste</div>
   <div class="box" style="margin-top:26px;box-shadow:8px 8px 0 #ff3399"><div class="row">{TT(48)}{IG(48)}{XX(48)}</div>
    <div style="font:600 24px Inter;color:#a7a3e0;margin-top:20px;white-space:nowrap;overflow:hidden">tiktok.com/@ronniesbiolo…</div></div>
  </div>
  <div style="width:400px">
   <div class="big" style="color:#ffcc00">2 crop</div>
   <div style="margin-top:26px;position:relative;width:300px">{tile("HENRY",300,False)}
    <div style="position:absolute;inset:-14px;border:5px dashed #ffcc00"></div></div>
  </div>
  <div style="width:520px">
   <div class="big" style="color:#66ff99">3 coin</div>
   <div class="box" style="margin-top:26px;box-shadow:8px 8px 0 #66ff99;display:flex;gap:22px;align-items:center">
    {tile("HENRY",130,False)}
    <div><div style="font:400 40px Bungee">$HENRY</div>
     <div class="row" style="gap:10px;margin-top:10px;font:600 24px Inter">{PF(32)} live on pump.fun</div>
     <div style="font:600 22px Inter;color:#a7a3e0;margin-top:8px">241N…<b style="color:#fff">cLiP</b></div></div>
   </div>
  </div>
 </div>{foot()}</div>""")

# ---------- A2: coin wall (21 real coins)
cards["A2-wall"] = (1600, 900, f"""
<div class="card" style="padding:56px 70px 48px"><div class="row" style="justify-content:space-between">
 <div class="lab">already live on getclip.fun</div><div class="row" style="gap:12px;font:600 24px Inter">{PF(36)} every one a pump.fun coin</div></div>
 <div class="mid"><div class="wall" style="grid-template-columns:repeat(8,150px);gap:24px 30px;margin:0 auto">
  {''.join(tile(c["ticker"],150) for c in clips[:21])}
  <div style="display:flex;align-items:center;justify-content:center;font:400 54px Bungee;color:#ffcc00">+you</div>
 </div></div>{foot()}</div>""")

# ---------- A3: fees
cards["A3-fees"] = (1600, 900, f"""
<div class="card"><div class="glow" style="background:#66ff99;width:500px;height:500px;right:100px;top:150px;opacity:.25"></div>
 <div class="lab">creator fees</div>
 <div class="mid">
  <div style="flex:1"><h1 style="font-size:150px">0%<br><span class="p">to us.</span></h1></div>
  <div style="width:640px;display:flex;flex-direction:column;gap:30px">
   <div class="row" style="gap:16px;font:600 30px Inter">{PF(52)} every trade pays a creator fee</div>
   <div class="box" style="box-shadow:8px 8px 0 #66ff99"><div style="font:400 44px Bungee;color:#66ff99">→ you</div><div style="font:500 26px Inter;color:#a7a3e0;margin-top:6px">the launcher</div></div>
   <div style="font:400 30px Bungee;color:#a7a3e0;text-align:center">or</div>
   <div class="box" style="box-shadow:8px 8px 0 #00ccff"><div style="font:400 44px Bungee;color:#00ccff">→ holders</div><div style="font:500 26px Inter;color:#a7a3e0;margin-top:6px">paid out by pump.fun</div></div>
  </div>
 </div>{foot()}</div>""")

# ---------- S1 supply locked
cards["S1-locked"] = (1600, 900, f"""
<div class="card"><div class="slab" style="left:-200px;bottom:-300px;width:900px;height:700px;transform:rotate(12deg);background:#26235f"></div>
 <div class="lab">team supply</div>
 <div class="mid" style="justify-content:center;gap:110px">
  <div style="position:relative;width:420px;height:470px">
   <div style="position:absolute;left:80px;top:0;width:260px;height:260px;border:44px solid #ffcc00;border-bottom:none;border-radius:130px 130px 0 0"></div>
   <div style="position:absolute;left:0;top:180px;width:420px;height:290px;background:#ff3399;border:6px solid #0b0a24;box-shadow:12px 12px 0 #0b0a24;display:flex;align-items:center;justify-content:center">
    <img src="logos/logo-mark.png" style="height:210px"></div>
  </div>
  <h1 style="font-size:150px">locked.<br><span class="y">on-chain.</span></h1>
 </div>{foot()}</div>""")

# ---------- D1 dex paid
cards["D1-dexpaid"] = (1600, 900, f"""
<div class="card"><div class="glow" style="background:#00ccff;width:600px;height:500px;left:500px;top:150px;opacity:.3"></div>
 <div class="lab">token profile</div>
 <div class="mid" style="flex-direction:column;justify-content:center;gap:50px">
  <div class="row" style="gap:60px">
   <div class="row" style="gap:26px">{DX(170)}<span style="font:800 84px Inter;letter-spacing:-.02em">DEX Screener</span></div>
   <span style="font:400 90px Bungee;color:#ff3399">×</span>
   <img src="logos/pfp-1000.png" style="width:170px;height:170px;border:6px solid #0b0a24;box-shadow:10px 10px 0 #ffcc00">
  </div>
  <h1 style="font-size:170px;color:#66ff99">paid ✓</h1>
 </div>{foot()}</div>""")

# ---------- U1 prefix trick
cards["U1-prefix"] = (1600, 900, f"""
<div class="card"><div class="glow" style="background:#ff3399;width:700px;height:400px;left:200px;top:260px;opacity:.35"></div>
 <div class="lab">the shortcut</div>
 <div class="mid" style="flex-direction:column;justify-content:center;align-items:flex-start;gap:40px">
  <div class="box" style="width:100%;box-shadow:12px 12px 0 #ff3399;padding:44px 48px;display:flex;align-items:center;gap:0;white-space:nowrap">
   <span style="font:400 64px Bungee;color:#ff3399">getclip.fun/</span><span style="font:600 56px Inter;color:#a7a3e0;margin-left:6px">tiktok.com/@you/video/…</span>
  </div>
  <div class="row" style="gap:30px;font:400 54px Bungee"><span style="color:#ffcc00">↓</span> <span>straight to launch</span></div>
  <div class="row" style="gap:28px">{TT(64)}{IG(64)}{XX(64)}</div>
 </div>{foot()}</div>""")

# ---------- U2 vanity mint
m = [c["mint"] for c in clips]
cards["U2-mint"] = (1600, 900, f"""
<div class="card"><div class="lab">every mint address</div>
 <div class="mid" style="gap:80px">
  <div style="flex:1;display:flex;flex-direction:column;gap:16px;font:600 34px Inter;color:#a7a3e0">
   {''.join(f'<div class="row" style="gap:18px">{tile(c["ticker"],58,False)}<span>{c["mint"][:-4]}<b style="color:#ff3399;font-weight:800">{c["mint"][-4:]}</b></span></div>' for c in clips[16:21])}
  </div>
  <h1 style="font-size:130px;width:520px">ends<br>in <span class="p">clip</span></h1>
 </div>{foot()}</div>""")

# ---------- U3 free launch
cards["U3-free"] = (1600, 900, f"""
<div class="card"><div class="slab" style="right:-160px;top:-100px;width:760px;height:1100px;transform:rotate(10deg)"></div>
 <div class="lab">launch cost</div>
 <div class="mid" style="justify-content:space-between">
  <h1 style="font-size:150px">on<br><span class="y">us.</span></h1>
  <div style="width:560px;display:flex;flex-direction:column;gap:28px;margin-right:20px">
   <div class="box" style="box-shadow:10px 10px 0 #0b0a24"><div class="row" style="gap:18px">{SOL(64)}<span style="font:400 54px Bungee;white-space:nowrap">~0.006 SOL</span></div><div style="font:600 28px Inter;color:#a7a3e0;margin-top:10px">paid by CLIP</div></div>
   <div class="box" style="box-shadow:10px 10px 0 #0b0a24"><div style="font:400 64px Bungee;color:#66ff99">0 wallet</div><div style="font:600 28px Inter;color:#a7a3e0;margin-top:10px">needed to launch</div></div>
  </div>
 </div>{foot()}</div>""")

# ---------- U4 any feed
cards["U4-feeds"] = (1600, 900, f"""
<div class="card"><div class="lab">where clips come from</div>
 <div class="mid" style="justify-content:center;gap:90px">
  {''.join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:30px"><div class="box" style="width:340px;height:300px;display:flex;align-items:center;justify-content:center;box-shadow:12px 12px 0 {col}">{ic}</div><div style="font:400 44px Bungee">{nm}</div></div>' for ic,nm,col in [(TT(170),"TikTok","#ff3399"),(IG(170),"Instagram","#ffcc00"),(XX(160),"X","#00ccff")])}
 </div>{foot()}</div>""")

# ---------- U5 featured coin OMAKASE
o = by["OMAKASE"]
cards["U5-omakase"] = (1600, 900, f"""
<div class="card"><div class="glow" style="background:#ffcc00;width:500px;height:500px;left:120px;top:200px;opacity:.25"></div>
 <div class="lab">clip of the day</div>
 <div class="mid" style="gap:90px">
  {tile("OMAKASE",500,False,-3)}
  <div><h1 style="font-size:120px">${o['ticker'].lower()}</h1>
   <div style="font:600 34px Inter;color:#a7a3e0;margin-top:20px">{o['name']}</div>
   <div class="row" style="gap:16px;margin-top:40px;font:600 30px Inter">{PF(48)} live on pump.fun</div>
   <div style="font:600 28px Inter;color:#a7a3e0;margin-top:18px">{o['mint'][:6]}…<b style="color:#ff3399">{o['mint'][-4:]}</b></div>
  </div>
 </div>{foot()}</div>""")


# ---------- U6 upgrade: 60mb uploads
cards["U6-upgrade"] = (1600, 900, f"""
<div class="card"><div class="glow" style="background:#ff3399;width:520px;height:520px;left:980px;top:180px;opacity:.3"></div>
 <div class="lab" style="color:#ff3399">shipped</div>
 <div class="mid" style="gap:50px">
  <div style="flex:1"><h1 style="font-size:104px">drop any<br>video.<br><span class="y">up to 60mb.</span></h1>
   <div class="body" style="max-width:600px">first buy lands right after launch</div></div>
  <div class="box" style="width:340px;transform:rotate(-5deg);box-shadow:8px 8px 0 #00ccff">
   <div class="row" style="gap:12px;font:600 22px Inter;color:#a7a3e0">{TT(30)}{IG(30)} clip.mp4</div>
   <div style="font:400 104px/1 Bungee;margin:22px 0 4px;white-space:nowrap">60<span style="font-size:52px;color:#00ccff"> MB</span></div>
   <div style="height:18px;background:#0b0a24;margin-top:18px"><div style="height:100%;width:100%;background:#66ff99"></div></div>
   <div style="font:700 18px Inter;letter-spacing:.12em;color:#66ff99;margin-top:10px">UPLOADED 100%</div>
  </div>
  <div style="font:400 90px Bungee;color:#ffcc00">→</div>
  {tile("GOATS",300,True,4,True)}
 </div>{foot()}</div>""")

# ---------- L1 live (no ticker)
cards["L1-live"] = (1600, 900, f"""
<div class="card"><div class="slab" style="left:-100px;top:560px;width:1900px;height:600px;transform:rotate(-6deg)"></div>
 <div style="position:absolute;left:0;right:0;top:600px;display:flex;gap:28px;transform:rotate(-6deg);padding-left:40px">{''.join(tile(c["ticker"],170,False) for c in clips[2:11])}</div>
 <div class="lab" style="color:#66ff99">● status</div>
 <div style="margin-top:60px"><h1 style="font-size:190px">we are<br><span class="y">live.</span></h1></div>
</div>""")

html = "<!doctype html><html><head><meta charset=utf-8><link href='https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&display=swap' rel=stylesheet><style>" + CSS + "</style></head><body>"
for k, (w, h, inner) in cards.items():
    html += f'<div id="{k}" style="width:{w}px;height:{h}px">{inner}</div>'
html += "</body></html>"
(D / "posts.html").write_text(html)
json.dump({k: [w, h] for k, (w, h, _) in cards.items()}, open(D / "cards.json", "w"))
print(len(cards), "cards")
