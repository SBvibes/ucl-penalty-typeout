from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ATLAS = ROOT / "assets" / "sprite-atlas-v1.png"
OUT = ROOT / "assets" / "sprites"


SPRITES = {
    "psg_idle.png": (28, 45, 170, 240),
    "psg_ready.png": (207, 45, 145, 245),
    "psg_kick.png": (360, 84, 245, 215),
    "psg_follow.png": (610, 88, 190, 220),
    "psg_celebrate.png": (835, 45, 150, 250),
    "psg_kneel.png": (1042, 115, 165, 185),
    "psg_disappointed.png": (1222, 55, 155, 238),
    "psg_sitting.png": (1390, 158, 110, 140),
    "bayern_idle.png": (28, 340, 170, 240),
    "bayern_ready.png": (207, 340, 145, 245),
    "bayern_kick.png": (360, 378, 245, 215),
    "bayern_follow.png": (610, 382, 190, 220),
    "bayern_celebrate.png": (835, 340, 150, 250),
    "bayern_kneel.png": (1042, 412, 165, 185),
    "bayern_disappointed.png": (1222, 348, 155, 238),
    "bayern_sitting.png": (1390, 454, 110, 140),
    "keeper_idle.png": (55, 638, 175, 175),
    "keeper_dive_left.png": (325, 646, 335, 152),
    "keeper_dive_right.png": (632, 646, 300, 152),
    "keeper_save_center.png": (1010, 674, 188, 142),
    "keeper_save_low.png": (1295, 674, 190, 142),
    "ball.png": (118, 874, 92, 88),
    "ball_fast_1.png": (280, 876, 168, 88),
    "ball_fast_2.png": (466, 880, 220, 88),
    "ball_fast_3.png": (676, 880, 252, 88),
    "ball_in_net.png": (982, 858, 230, 145),
    "ball_miss_high.png": (1260, 842, 140, 160),
}


def remove_green_background(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    pixels = rgba.load()

    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            # The generated atlas background is bright chroma green with slight
            # variation. Keep darker teal/green pixels used in the keeper kit.
            if g > 185 and r < 95 and b < 95 and g > (r * 2.2) and g > (b * 2.2):
                pixels[x, y] = (r, g, b, 0)

    return rgba


def trim_alpha(img: Image.Image, padding: int = 6) -> Image.Image:
    alpha = img.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return img

    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(img.width, right + padding)
    bottom = min(img.height, bottom + padding)
    return img.crop((left, top, right, bottom))


def remove_player_green_fringe(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    pixels = rgba.load()

    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if (g > 105 and g > r * 1.18 and g > b * 1.18) or (
                g > 24 and r < 30 and b < 30 and g > r * 2.8 and g > b * 2.8
            ):
                pixels[x, y] = (r, g, b, 0)

    return rgba


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    atlas = Image.open(ATLAS)

    for name, box in SPRITES.items():
        x, y, w, h = box
        crop = atlas.crop((x, y, x + w, y + h))
        sprite = remove_green_background(crop)
        if name.startswith(("psg_", "bayern_")):
            sprite = remove_player_green_fringe(sprite)
        sprite = trim_alpha(sprite)
        sprite.save(OUT / name)

    print(f"Extracted {len(SPRITES)} sprites to {OUT}")


if __name__ == "__main__":
    main()
