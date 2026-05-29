#!/bin/bash
# Generate SpecForge desktop icons at multiple sizes
# Requires ImageMagick: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)

ICON_DIR="desktop/src-tauri/icons"
BASE_SIZE=1024

# Create base icon (gradient purple/blue circle with "S" logo)
# This creates a placeholder - replace with actual logo
convert -size ${BASE_SIZE}x${BASE_SIZE} xc:transparent \
  -fill "linear-gradient(135deg,#a78bfa,#60a5fa)" \
  -draw "circle ${BASE_SIZE}/2,${BASE_SIZE}/2 ${BASE_SIZE}/2,${BASE_SIZE}/2" \
  -fill white -gravity center -pointsize 512 -annotate +0+0 "S" \
  "$ICON_DIR/icon.png"

# Generate required sizes for Tauri
for size in 32 128 256 512; do
  convert "$ICON_DIR/icon.png" -resize ${size}x${size} "$ICON_DIR/${size}x${size}.png"
done

# Generate macOS icns (requires macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
  mkdir -p "$ICON_DIR/icon.iconset"
  for size in 16 32 64 128 256 512 1024; do
    convert "$ICON_DIR/icon.png" -resize ${size}x${size} "$ICON_DIR/icon.iconset/icon_${size}x${size}.png"
    convert "$ICON_DIR/icon.png" -resize $((size*2))x$((size*2)) "$ICON_DIR/icon.iconset/icon_${size}x${size}@2x.png"
  done
  iconutil -c icns "$ICON_DIR/icon.iconset" -o "$ICON_DIR/icon.icns"
fi

echo "Icons generated successfully"