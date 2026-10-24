# Renders all CLIP brand assets. Run: python3 brand/render.py (from ~/clipfun)
import pathlib, asyncio, base64
from playwright.async_api import async_playwright
D = pathlib.Path(__file__).parent
F = base64.b64encode((D/"fonts/Bungee-Regular.ttf").read_bytes()).decode()
P,Y,S,G,N = "#ff3399","#ffcc00","#00ccff","#66ff99","#14123a"
def ico(n,c): return (D/f"{n}.svg").read_text().replace("<path",f'<path fill="{c}"')
CSS = f"""@font-face{{font-family:B;src:url(data:font/ttf;base64,{F})}}
*{{margin:0;box-sizing:border-box}}body{{font-family:B;background:transparent}}
.g{{display:grid;grid-template-columns:1fr 1fr;line-height:.82;text-align:center}}
.l{{display:flex;align-items:center;justify-content:center}}"""
def grid(cols, size, shadow):
    return f'<div class="g" style="font-size:{size}px">' + "".join(
        f'<span style="color:{c};text-shadow:{shadow}">{ch}</span>' for ch,c in zip("CLIP",cols)) + "</div>"
sq = lambda bg, inner: f'<div class="l" style="width:1000px;height:1000px;background:{bg}">{inner}</div>'
W = ["#fff"]*4; PARTY=[P,Y,S,G]
A = sq(P, grid(W, 470, f"14px 14px 0 {N}"))
B = sq(N, grid(PARTY, 470, "14px 14px 0 rgba(0,0,0,.55)"))
C = sq(P, f'<svg width="620" height="620" viewBox="0 0 100 100"><polygon points="30,14 30,86 90,50" fill="{N}" transform="translate(5,5)" stroke="{N}" stroke-width="10" stroke-linejoin="round"/><polygon points="30,14 30,86 90,50" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round"/></svg>')
word = lambda fs: '<div style="display:flex;align-items:baseline;line-height:1">' + "".join(
    f'<span style="font-size:{fs}px;color:{c};text-shadow:{fs//25}px {fs//25}px 0 rgba(0,0,0,.45)">{ch}</span>' for ch,c in zip("CLIP",PARTY)
    ) + f'<span style="font-size:{int(fs*.6)}px;color:#fff;margin-left:.08em">.fun</span></div>'
plats = "".join(f'<div style="width:46px;height:46px">{ico(n,"#fff")}</div>' for n in ["tiktok","instagram","x"])
BANNER = f'''<div style="width:1500px;height:500px;background:{N};position:relative;overflow:hidden">
<div style="position:absolute;inset:0;background-image:radial-gradient({"#322e78"} 2px,transparent 2px);background-size:28px 28px;opacity:.7"></div>
<div style="position:absolute;right:-60px;top:-40px;width:520px;height:520px;background:{P};transform:rotate(12deg);border-radius:40px"></div>
<div style="position:absolute;right:40px;top:70px">{grid(W,170,f"8px 8px 0 {N}")}</div>
<div style="position:absolute;left:400px;top:70px;width:620px">
 <div style="font-size:64px;line-height:1.02;color:#fff">ANY VIRAL CLIP<br>BECOMES A <span style="color:{P}">PUMP.FUN</span><br><span style="color:{Y}">COIN.</span></div>
 <div style="display:flex;gap:22px;align-items:center;margin-top:34px">{plats}<span style="font-size:40px;color:{S};margin-left:14px">GETCLIP.FUN</span></div>
</div></div>'''
OG = f'''<div style="width:1200px;height:630px;background:{N};position:relative;overflow:hidden;padding:70px">
<div style="position:absolute;inset:0;background-image:radial-gradient(#322e78 2px,transparent 2px);background-size:28px 28px;opacity:.7"></div>
<div style="position:relative">{word(120)}
<div style="font-size:66px;line-height:1.05;color:#fff;margin-top:50px">ANY VIRAL CLIP BECOMES<br>A <span style="color:{P}">PUMP.FUN COIN.</span></div>
<div style="display:flex;gap:22px;align-items:center;margin-top:46px">{plats}<span style="font-size:38px;color:{Y};margin-left:14px">FREE. NO WALLET.</span></div></div></div>'''
fake = ["#2b2f3a","#3a2f2b","#2b3a33","#33303d"]
def row(img, name, tick):
    return f'''<div style="display:flex;align-items:center;gap:14px;padding:10px 16px;border-bottom:1px solid #1f2229;font-family:Inter,Arial;color:#cfd3dc">
<div style="width:70px;height:70px;border-radius:6px;overflow:hidden;background:#222">{img}</div>
<div><div style="font-weight:700;color:#fff;font-size:15px">{tick} <span style="color:#8a90a0;font-weight:400">{name}</span></div><div style="font-size:12px;color:#6b7180">3s  MC $4.2K  V $810</div></div></div>'''
def pulse(variant):
    im = f'<img src="data:image/png;base64,{base64.b64encode((D/f"token-{variant}.png").read_bytes()).decode()}" style="width:70px;height:70px">'
    fk = lambda c: f'<div style="width:70px;height:70px;background:linear-gradient(135deg,{c},#555 60%,#888)"></div>'
    return f'<div style="background:#0e1014;width:380px"><div style="color:#fff;font-family:Arial;padding:8px 16px;font-size:13px">Variant {variant.upper()}</div>' + row(fk(fake[0]),"Doge Wif Hat","$DWH") + row(im,"CLIP","$CLIP") + row(fk(fake[1]),"pepe2","$PEPE2") + row(fk(fake[2]),"Moon Cat","$MCAT") + "</div>"
async def shot(pg, html, out, w, h, transparent=False):
    await pg.set_viewport_size({"width":w,"height":h})
    await pg.set_content(f"<style>{CSS}</style>{html}"); await pg.evaluate("document.fonts.ready")
    await pg.screenshot(path=str(D/out), omit_background=transparent, clip={"x":0,"y":0,"width":w,"height":h})
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        for n,h in [("a",A),("b",B),("c",C)]: await shot(pg,h,f"token-{n}.png",1000,1000)
        await shot(pg,A,"token-1000.png",1000,1000); await shot(pg,A,"pfp-1000.png",1000,1000)
        await shot(pg,BANNER,"x-banner-1500x500.png",1500,500)
        await shot(pg,OG,"og-1200x630.png",1200,630)
        await shot(pg,f'<div class="l" style="width:1400px;height:420px">{word(300)}</div>',"logo-wordmark.png",1400,420,True)
        await shot(pg,f'<div class="l" style="width:800px;height:800px">{grid(PARTY,380,"12px 12px 0 rgba(0,0,0,.45)")}</div>',"logo-mark.png",800,800,True)
        await shot(pg,'<div style="display:flex;gap:20px;background:#08090c;padding:20px">'+"".join(pulse(v) for v in "abc")+"</div>","preview-pulse.png",1220,400)
        imgs = ["pfp-1000.png","token-a.png","token-b.png","token-c.png","x-banner-1500x500.png","og-1200x630.png","logo-wordmark.png","logo-mark.png","preview-pulse.png"]
        tiles = "".join(f'<div style="background:#2a2850;padding:10px;color:#fff;font-family:Arial;font-size:13px"><img src="data:image/png;base64,{base64.b64encode((D/i).read_bytes()).decode()}" style="max-width:560px;max-height:300px;display:block">{i}</div>' for i in imgs)
        await shot(pg,f'<div style="background:{N};padding:20px;display:flex;flex-wrap:wrap;gap:16px;width:1800px;align-items:flex-start">{tiles}</div>',"contact-sheet.png",1800,1100)
        await b.close()
asyncio.run(main())
