# Relights the living-room photo into the three moods used by the lighting block
# (warm evening as shot, natural 4000 K, cool 6000 K). The window glass is masked so the
# dusk sky stays the same. Usage: python3 relight.py living-room-hero.jpg
import numpy as np, sys
from PIL import Image, ImageFilter
src = Image.open(sys.argv[1]).convert('RGB')
W, H = src.size
a = np.asarray(src).astype(np.float32) / 255
lin = np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)

def px(x, y, r=0.02):
    x0, x1 = int((x - r) * W), int((x + r) * W); y0, y1 = int((y - r) * H), int((y + r) * H)
    return lin[y0:y1, x0:x1].reshape(-1, 3).mean(0)
wall = (px(0.14, 0.40) + px(0.30, 0.45) + px(0.31, 0.32)) / 3
print('wall lin', wall, 'ratio', wall / wall.max())

# window mask: glass areas, only bluish/dark pixels (sky, night city), feathered
m = np.zeros((H, W), np.float32)
def rect(x0, y0, x1, y1):
    m[int(y0 * H):int(y1 * H), int(x0 * W):int(x1 * W)] = 1
rect(0.372, 0.235, 0.808, 0.53)   # main window above the sofa
rect(0.84, 0.13, 1.0, 0.62)       # right corner window
blue = np.clip((a[..., 2] - a[..., 0]) * 6 + 0.5, 0, 1)
dark = np.clip((0.35 - a.mean(-1)) * 4, 0, 1)
win = m * np.maximum(blue, dark)
full = np.zeros((H, W), np.float32)
full[int(0.235 * H):int(0.485 * H), int(0.372 * W):int(0.808 * W)] = 1   # glass above the sofa back
full[int(0.20 * H):int(0.56 * H), int(0.845 * W):] = 1                   # corner window above the armchair
win = np.maximum(win, full)
# the pendant lamp hangs in front of the glass: there, keep only the sky pixels
by0, by1, bx0, bx1 = int(0.25 * H), int(0.36 * H), int(0.51 * W), int(0.655 * W)
box = a[by0:by1, bx0:bx1]
sky = np.clip((box[..., 2] - box[..., 0]) * 10 + 0.3, 0, 1) * np.clip((0.55 - box.mean(-1)) * 6, 0, 1)
sky = np.asarray(Image.fromarray((sky * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32) / 255
win[by0:by1, bx0:bx1] = sky
win = np.asarray(Image.fromarray((win * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(W / 400))).astype(np.float32) / 255
Image.fromarray((win * 255).astype(np.uint8)).save('mask.png')

def tone(x, white=1.0):
    # soft shoulder so the lamps don't clip
    return x * (1 + x / (white * white)) / (1 + x)

def make(target_ratio, ev, sat=1.0, lift=0.0):
    t = np.array(target_ratio, np.float32)
    g = (t / t.max()) / (wall / wall.max())
    Y = lambda c: float((c * [0.2126, 0.7152, 0.0722]).sum())
    g = g * Y(wall) / Y(wall * g)                     # keep the wall's brightness, change only its colour
    out = lin * g * (2 ** ev)
    lum = (out * [0.2126, 0.7152, 0.0722]).sum(-1, keepdims=True)
    out = lum + (out - lum) * sat
    out = np.clip(tone(out * 1.35, 1.6) / tone(1.35, 1.6), 0, 1) if ev > 0 else np.clip(out, 0, 1)
    w = win[..., None]
    out = out * (1 - w) + lin * w
    srgb = np.where(out <= 0.0031308, out * 12.92, 1.055 * out ** (1 / 2.4) - 0.055)
    return Image.fromarray((np.clip(srgb, 0, 1) * 255 + 0.5).astype(np.uint8))

warm = make(wall, -0.05, 1.04)                        # the photo as shot, a touch richer
natural = make([1.0, 0.89, 0.70], 0.55, 0.92)
cool = make([0.88, 0.94, 1.0], 0.7, 0.8)
for name, im in [('warm', warm), ('natural', natural), ('cool', cool)]:
    im.save(f'living-{name}.png')
    im.resize((1200, int(1200 * H / W)), Image.LANCZOS).save(f'view-{name}.jpg', quality=88)
