#!/bin/bash
set -e

echo "🎨 Setting up icon generation..."

# Check if PIL/Pillow is installed
if ! python3 -c "import PIL" 2>/dev/null; then
    echo "Installing Pillow (PIL)..."
    pip3 install --user Pillow
fi

# Run the icon generator
echo ""
python3 /workspaces/studio/generate_icons.py

echo ""
echo "✓ Done! Your new icons are ready in public/icons/"
