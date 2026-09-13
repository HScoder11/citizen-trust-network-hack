# backend/verification.py

from PIL import Image
import numpy as np
from skimage.metrics import structural_similarity as ssim

def compare_images(before_path: str, after_path: str) -> dict:
    try:
        # Load both images, convert to grayscale, normalize size
        img1 = Image.open(before_path).convert("L").resize((256, 256))
        img2 = Image.open(after_path).convert("L").resize((256, 256))

        arr1 = np.array(img1)
        arr2 = np.array(img2)

        # Structural similarity score (1.0 = identical)
        score = ssim(arr1, arr2)
        print(f"DEBUG: raw ssim score = {score}")

        # For "work completed", we want *low* similarity
        confidence = round(1 - score, 2) if score < 1 else 0.0
        print(f"DEBUG: computed confidence = {confidence}")

        passed = confidence > 0.3  # threshold: meaningful visual change

        return {
            "confidence": float(max(0.0, min(confidence, 1.0))),
            "pass": bool(passed)
        }
    except Exception as e:
        print(f"Verification error: {e}")
        return {"confidence": 0.0, "pass": False}
