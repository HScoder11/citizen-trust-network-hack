# backend/test_verification.py

from verification import compare_images
from PIL import Image
import os

def test_identical_images_show_low_change_confidence():
    # Business logic: identical before/after means NO real-world change happened,
    # so our inverted 'confidence' should be near 0 and pass should be False.
    img = Image.new("RGB", (100, 100), color=(120, 50, 30))
    img.save("test_a.jpg")
    img.save("test_b.jpg")

    result = compare_images("test_a.jpg", "test_b.jpg")

    assert result["confidence"] < 0.1
    assert result["pass"] is False

    os.remove("test_a.jpg")
    os.remove("test_b.jpg")


def test_very_different_images_show_high_change_confidence():
    # Business logic: very different before/after means REAL change happened,
    # so our inverted 'confidence' should be high and pass should be True.
    img1 = Image.new("RGB", (100, 100), color=(0, 0, 0))
    img2 = Image.new("RGB", (100, 100), color=(255, 255, 255))
    img1.save("test_c.jpg")
    img2.save("test_d.jpg")

    result = compare_images("test_c.jpg", "test_d.jpg")

    assert result["confidence"] > 0.8
    assert result["pass"] is True

    os.remove("test_c.jpg")
    os.remove("test_d.jpg")
