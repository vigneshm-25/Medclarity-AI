from PIL import Image
import pytesseract

# Correct path to the executable
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

img = Image.open("medical prescription 1.jpg")

text = pytesseract.image_to_string(img, lang="eng")

print("=" * 60)
print(text)
print("=" * 60)