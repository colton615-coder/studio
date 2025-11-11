#!/usr/bin/env python3
"""Generate PWA icons for LiFE-iN-SYNC app"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import os

def create_radial_gradient(size, color_center, color_edge):
    """Create a radial gradient background"""
    img = Image.new('RGB', (size, size))
    center = size // 2
    max_radius = math.sqrt(2) * center
    
    for y in range(size):
        for x in range(size):
            dist = math.sqrt((x - center) ** 2 + (y - center) ** 2)
            ratio = min(dist / max_radius, 1.0)
            r = int(color_center[0] * (1 - ratio) + color_edge[0] * ratio)
            g = int(color_center[1] * (1 - ratio) + color_edge[1] * ratio)
            b = int(color_center[2] * (1 - ratio) + color_edge[2] * ratio)
            img.putpixel((x, y), (r, g, b))
    
    return img

def add_glow(img, text_layer, glow_amount=20):
    """Add a glow effect around the text"""
    for i in range(glow_amount, 0, -4):
        glow = text_layer.filter(ImageFilter.GaussianBlur(i))
        img.paste(glow, (0, 0), glow)
    return img

def create_icon(size, output_path):
    """Create a single icon with specified size"""
    
    # Theme colors - purple gradient
    lighter_purple = (200, 150, 255)  # Lighter for center
    darker_purple = (120, 60, 200)    # Darker for edges
    
    # Create radial gradient background
    img = create_radial_gradient(size, lighter_purple, darker_purple)
    
    # Create a separate layer for text with transparency
    text_layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    text_draw = ImageDraw.Draw(text_layer)
    
    # Calculate font size (50% of icon size)
    font_size = int(size * 0.5)
    font = None
    
    # Try to load a nice bold font
    for font_path in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
                      '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
                      '/System/Library/Fonts/Helvetica.ttc']:
        try:
            font = ImageFont.truetype(font_path, font_size)
            break
        except:
            continue
    
    if font is None:
        font = ImageFont.load_default()
    
    # Draw "LiS" text
    text = "LiS"
    
    # Get text bounding box for centering
    bbox = text_draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Center position
    x = (size - text_width) // 2 - bbox[0]
    y = (size - text_height) // 2 - bbox[1]
    
    # Draw shadow (dark purple, slightly offset)
    shadow_offset = max(3, size // 80)
    text_draw.text((x + shadow_offset, y + shadow_offset), text, 
                   fill=(50, 20, 80, 200), font=font)
    
    # Draw main text (white)
    text_draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    # Convert main image to RGBA for compositing
    img = img.convert('RGBA')
    
    # Add glow effect
    img = add_glow(img, text_layer, glow_amount=max(10, size // 40))
    
    # Composite text layer
    img = Image.alpha_composite(img, text_layer)
    
    # Add a subtle circular highlight overlay for depth
    overlay = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    highlight_margin = int(size * 0.15)
    overlay_draw.ellipse([highlight_margin, highlight_margin, 
                          size - highlight_margin, size - highlight_margin],
                         fill=(255, 255, 255, 15))
    img = Image.alpha_composite(img, overlay)
    
    # Add rounded corners for modern look
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    corner_radius = int(size * 0.2)  # 20% corner radius
    mask_draw.rounded_rectangle([0, 0, size, size], 
                                radius=corner_radius, fill=255)
    
    # Apply mask
    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    output.paste(img, (0, 0))
    output.putalpha(mask)
    
    # Save as PNG
    output.save(output_path, 'PNG', optimize=True)
    file_size = os.path.getsize(output_path)
    print(f"✓ Created {output_path} ({size}x{size}px, {file_size/1024:.1f}KB)")
    
    return file_size

def main():
    """Generate both icon sizes"""
    print("🎨 Generating LiFE-iN-SYNC PWA Icons...\n")
    
    # Create 192x192 icon
    size_192 = create_icon(192, '/workspaces/studio/public/icons/icon-192x192.png')
    
    # Create 512x512 icon
    size_512 = create_icon(512, '/workspaces/studio/public/icons/icon-512x512.png')
    
    print("\n" + "="*60)
    print("✓ Icon generation complete!")
    print("="*60)
    print("\nYour new PWA icons feature:")
    print("  • Purple gradient background (matching theme #A96BFF)")
    print("  • 'LiS' text with glow and shadow effects")
    print("  • Rounded corners for modern appearance")
    print("  • Optimized PNG files")
    print("\nTo see the new icon:")
    print("  1. Deploy/rebuild your PWA")
    print("  2. Remove old app from home screen")
    print("  3. Re-add to home screen")

if __name__ == '__main__':
    main()
