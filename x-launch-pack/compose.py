"""Renders the CLIP · Leonida X pack: python3 compose.py (from x-launch-pack/)."""
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(ROOT)
F = lambda n, s: ImageFont.truetype(os.path.join(ROOT, "fonts", n), s)
SAT = Image.open(os.path.join(REPO, "public/map/leonida-sat.jpg")).convert("RGB")
LOGO = Image.open(os.path.join(REPO, "public/brand/logo-1024.png")).convert("RGBA")
INK, HAZE, PINK, BG = (255, 246, 240), (196, 186, 205), (255, 61, 139), (10, 6, 24)
SUNSET = [(255, 184, 77), (255, 61, 139), (176, 77, 255)]


def grad(w, h, stops=SUNSET):
    g = Image.new("RGB", (w, 1))
    for x in range(w):
        t = x / max(w - 1, 1) * (len(stops) - 1); i = min(int(t), len(stops) - 2); f = t - i
        g.putpixel((x, 0), tuple(int(stops[i][k] + (stops[i + 1][k] - stops[i][k]) * f) for k in range(3)))
    return g.resize((w, h))


def gtext(img, xy, txt, font):
    """Text filled with the sunset gradient."""
    l, t, r, b = font.getbbox(txt)
    m = Image.new("L", (r, b)); ImageDraw.Draw(m).text((0, 0), txt, font=font, fill=255)
    img.paste(grad(r, b), xy, m)


def backdrop(w, h, u=0.66, v=0.55, zoom=0.35, blur=60, dark=0.42):
    W, H = SAT.size; cw = int(W * zoom); ch = int(cw * h / w)
    x = int(min(max(u * W - cw / 2, 0), W - cw)); y = int(min(max(v * H - ch / 2, 0), H - ch))
    im = SAT.crop((x, y, x + cw, y + ch)).resize((w, h)).filter(ImageFilter.GaussianBlur(blur))
    im = Image.blend(Image.new("RGB", (w, h), BG), im, dark)
    glow = Image.new("RGB", (w, h), BG); d = ImageDraw.Draw(glow)
    d.ellipse((int(w * .55), int(-h * .4), int(w * 1.3), int(h * .7)), fill=(120, 30, 90))
    d.ellipse((int(-w * .3), int(h * .55), int(w * .45), int(h * 1.5)), fill=(110, 60, 20))
    return ImageChops.screen(im, glow.filter(ImageFilter.GaussianBlur(int(w * .12))))


def map_card(w, h, u, v, zoom, pins):
    """Sharp crop of the real map with brand pins."""
    W, H = SAT.size; cw = int(W * zoom); ch = int(cw * h / w)
    x0 = int(u * W - cw / 2); y0 = int(v * H - ch / 2)
    im = SAT.crop((x0, y0, x0 + cw, y0 + ch)).resize((w, h)).convert("RGBA")
    d = ImageDraw.Draw(im)
    for pu, pv in pins:
        px = (pu * W - x0) / cw * w; py = (pv * H - y0) / ch * h
        d.line((px, py, px, py - 46), fill=INK, width=4)
        d.ellipse((px - 18, py - 64, px + 18, py - 28), fill=PINK, outline=INK, width=4)
        d.ellipse((px - 7, py - 6, px + 7, py + 6), fill=INK)
    m = Image.new("L", (w, h)); ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), 36, fill=255)
    im.putalpha(m); return im


def sol_logo(s):
    im = Image.new("RGBA", (s, s)); g = grad(s, s, [(153, 69, 255), (20, 241, 149)]).convert("RGBA")
    m = Image.new("L", (s, s)); d = ImageDraw.Draw(m); bh = s * .2; sk = s * .2
    for i, y in enumerate((s * .12, s * .4, s * .68)):
        if i == 1: d.polygon([(0, y), (s - sk, y), (s, y + bh), (sk, y + bh)], fill=255)
        else: d.polygon([(sk, y), (s, y), (s - sk, y + bh), (0, y + bh)], fill=255)
    im.paste(g, (0, 0), m); return im


def footer(img, y):
    d = ImageDraw.Draw(img); w = img.width
    d.line((120, y, w - 120, y), fill=(255, 255, 255, 40) if img.mode == "RGBA" else (70, 58, 90), width=2)
    img.paste(LOGO.resize((44, 44)), (120, y + 28), LOGO.resize((44, 44)))
    d.text((178, y + 34), "getclip.fun", font=F("Inter-600.ttf", 28), fill=INK)
    f = F("Inter-600.ttf", 26); t = "Solana"; tw = d.textlength(t, font=f)
    d.text((w - 120 - tw, y + 36), t, font=f, fill=HAZE)
    s = sol_logo(30); img.paste(s, (int(w - 120 - tw - 42), y + 38), s)


def post(name, label, l1, l2, body, side=None, bg=(0.66, 0.55)):
    W, H = 1600, 900
    img = backdrop(W, H, *bg); d = ImageDraw.Draw(img)
    tx = 120; maxw = 760 if side else 1300
    d.text((tx, 92), label, font=F("Yellowtail-1.ttf", 54), fill=PINK)
    big = F("Anton-1.ttf", 128 if side else 150)
    lh = big.getbbox("Ag")[3] + 6
    bf = F("Inter-400.ttf", 36); lines = []
    for para in body.split("\n"):
        cur = ""
        for word in para.split():
            nxt = (cur + " " + word).strip()
            if d.textlength(nxt, font=bf) > maxw: lines.append(cur); cur = word
            else: cur = nxt
        lines.append(cur)
    block = lh * 2 + 30 + len(lines) * 50
    y = 175 + (H - 150 - 175 - block) // 2
    d.text((tx, y), l1, font=big, fill=INK); gtext(img, (tx, y + lh), l2, big)
    y += lh * 2 + 30
    for ln in lines: d.text((tx, y), ln, font=bf, fill=HAZE); y += 50
    if side: img.paste(side, (W - 120 - side.width, (H - 150 - side.height) // 2 + 60), side)
    footer(img, H - 140)
    img.save(os.path.join(ROOT, "img", name + ".png"))


def dexpaid():
    W, H = 1600, 900; img = backdrop(W, H, 0.5, 0.4); d = ImageDraw.Draw(img)
    dex = Image.open(os.path.join(ROOT, "logos/dex.png")).convert("RGBA").resize((170, 170))
    lg = LOGO.resize((170, 170))
    img.paste(lg, (W // 2 - 230, 200), lg); img.paste(dex, (W // 2 + 60, 200), dex)
    d.text((W // 2, 285), "×", font=F("Inter-400.ttf", 70), fill=HAZE, anchor="mm")
    f = F("Anton-1.ttf", 130); t1 = "DEX Screener"; t2 = "paid"
    tw = d.textlength(t1 + " ", font=f) + d.textlength(t2, font=f); x = (W - tw) / 2
    d.text((x, 440), t1, font=f, fill=INK); gtext(img, (int(x + d.textlength(t1 + " ", font=f)), 440), t2, f)
    d.text((W // 2, 650), "Profile, socials and banner are up.", font=F("Inter-400.ttf", 36), fill=HAZE, anchor="mm")
    footer(img, H - 140); img.save(os.path.join(ROOT, "img/D1-dexpaid.png"))


def banner():
    W, H = 1500, 500; img = backdrop(W, H, 0.68, 0.5, zoom=0.5, blur=30, dark=0.55); d = ImageDraw.Draw(img)
    pins = map_card(400, 380, 0.68, 0.54, 0.14, [(0.676, 0.552), (0.70, 0.53), (0.66, 0.57)])
    img.paste(pins, (W - 60 - 400, 60), pins)
    f = F("Anton-1.ttf", 84); x = 440
    d.text((x - 4, 70), "Welcome to Leonida", font=F("Yellowtail-1.ttf", 46), fill=PINK)
    d.text((x, 140), "Every clip", font=f, fill=INK); gtext(img, (x, 250), "becomes a coin.", f)
    d.text((x, 385), "getclip.fun  ·  pump.fun  ·  Solana", font=F("Inter-600.ttf", 26), fill=HAZE)
    img.save(os.path.join(ROOT, "img/x-banner.png"))


def live():
    W, H = 1600, 900; img = backdrop(W, H, 0.676, 0.552, zoom=0.25, blur=25, dark=0.6); d = ImageDraw.Draw(img)
    d.text((W // 2, 250), "Leonida is open", font=F("Yellowtail-1.ttf", 70), fill=PINK, anchor="mm")
    f = F("Anton-1.ttf", 230); t = "WE ARE LIVE"; tw = d.textlength(t, font=f)
    gtext(img, (int((W - tw) / 2), 300), t, f)
    d.text((W // 2, 640), "Paste a clip. Drop it on the map. It's a coin.", font=F("Inter-400.ttf", 38), fill=HAZE, anchor="mm")
    footer(img, H - 140); img.save(os.path.join(ROOT, "img/L1-live.png"))


if __name__ == "__main__":
    os.makedirs(os.path.join(ROOT, "img"), exist_ok=True)
    Image.open(os.path.join(REPO, "public/brand/logo-1024.png")).convert("RGB").save(os.path.join(ROOT, "img/pfp.png"))
    banner()
    vc = [(0.676, 0.552), (0.70, 0.53), (0.655, 0.575), (0.69, 0.585)]
    post("T1-road", "road to GTA 6", "Leonida is about", "to go viral.", "Hundreds of millions of clips are coming. Each one can be a coin.")
    post("T2-map", "the map", "Drop it where", "it happened.", "Pick the spot in Leonida. Your coin pins there for everyone to see.",
         side=map_card(620, 560, 0.68, 0.555, 0.13, vc))
    post("T3-free", "on us", "Zero SOL", "to launch.", "We pay the launch. Paste the address your creator fees go to. That's it.")
    post("T4-mint", "the signature", "Ends in", "gta6.", "Every coin from getclip.fun carries the same mark at the end of its address.",
         side=map_card(560, 520, 0.85, 0.49, 0.12, [(0.853, 0.487), (0.84, 0.52)]))
    post("T5-fees", "the clipper earns", "Your clip.", "Your fees.", "pump.fun creator fees go to you, or to the holders if you pick it.\n0% to us.")
    post("T6-prefix", "shortcut", "getclip.fun/", "+ any link", "Type it in front of a TikTok or X link and land straight on the launch.")
    post("T7-plots", "first come", "Empty map.", "Not for long.", "Vice City, Vice Beach, the Keys, the Everglades. Best plots go to the first clips.",
         side=map_card(560, 560, 0.62, 0.62, 0.28, []))
    live(); dexpaid()

    # Countdown cards, one per day to release (C9 … C1), each on a different district.
    spots = [("Vice City", .676, .552), ("Vice Beach", .853, .487), ("Port Gellhorn", .297, .364), ("Key Lento", .57, .838),
             ("Ambrosia", .554, .349), ("Lummox County", .479, .184), ("Waning Sands", .726, .339), ("Hamlet", .559, .704), ("Leaf Links", .763, .425)]
    LM = Image.open(os.path.join(REPO, "public/map/landmask.png")).convert("L")
    def land(u, v):
        """Nearest land point to (u, v) on the land mask."""
        w, h = LM.size
        for r in range(0, 60, 2):
            for du in range(-r, r + 1, 2):
                for dv in (-r, r) if abs(du) != r else range(-r, r + 1, 2):
                    x, y = int(u * w) + du, int(v * h) + dv
                    if 0 <= x < w and 0 <= y < h and LM.getpixel((x, y)) > 128: return x / w, y / h
        return u, v
    for n, (name, u, v) in zip(range(9, 0, -1), spots):
        pins = [land(u, v), land(u + .015, v - .02), land(u - .02, v + .015)]
        post(f"C{n}", name, f"{n} day{'s' if n > 1 else ''}", "to Leonida.", "Clips are already landing on the map.",
             side=map_card(560, 560, u, v, 0.12, pins), bg=(u, v))
