#!/usr/bin/env python3
import struct
import zlib
import os

def create_rgba_png(width, height, r, g, b, a=255):
    """Create a simple solid color RGBA PNG."""
    
    def make_chunk(chunk_type, data):
        chunk = chunk_type + data
        crc = zlib.crc32(chunk) & 0xffffffff
        return struct.pack('>I', len(data)) + chunk + struct.pack('>I', crc)
    
    # PNG Header
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR: width, height, bit depth 8, color type 6 (RGBA), compression 0, filter 0, interlace 0
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png += make_chunk(b'IHDR', ihdr)
    
    # Image data: each row starts with filter byte 0, then RGBA pixels
    raw = b''
    for _ in range(height):
        raw += b'\x00'  # filter byte
        raw += bytes([r, g, b, a]) * width
    
    # Compress and add IDAT
    compressed = zlib.compress(raw, 9)
    png += make_chunk(b'IDAT', compressed)
    
    # IEND
    png += make_chunk(b'IEND', b'')
    
    return png

# Indigo color
R, G, B = 99, 102, 241

icons_dir = 'packages/desktop/src-tauri/icons'
os.makedirs(icons_dir, exist_ok=True)

icons = [
    (32, '32x32.png'),
    (128, '128x128.png'),
    (256, '128x128@2x.png'),
    (512, 'icon.png'),
]

# Helper to create a proper ICO file
def create_ico(png_data):
    """
    Create a simple ICO file containing a single PNG image.
    ICO format:
    - Header (6 bytes): Reserved(2) | Type(2) | Count(2)
    - Directory (16 bytes per image): Width | Height | Colors | Reserved | Planes | BPP | Size | Offset
    - Image Data (PNG data)
    """
    
    # Header: Reserved(0), Type(1 for ICO), Count(1 image)
    header = struct.pack('<HHH', 0, 1, 1)
    
    # Image content (we use the 256x256 PNG data)
    image_data = png_data
    image_size = len(image_data)
    
    # Directory Entry
    # Width(0=256), Height(0=256), Colors(0), Res(0), Planes(1), BPP(32), Size, Offset(6+16=22)
    directory = struct.pack('<BBBBHHII', 0, 0, 0, 0, 1, 32, image_size, 22)
    
    return header + directory + image_data

# Generate icons
for size, name in icons:
    data = create_rgba_png(size, size, R, G, B)
    with open(os.path.join(icons_dir, name), 'wb') as f:
        f.write(data)
    print(f'Created {name} ({size}x{size}) - {len(data)} bytes')

    # Save 256x256 version for ICO creation
    if size == 256:
        # Create valid ICO
        ico_data = create_ico(data)
        with open(os.path.join(icons_dir, 'icon.ico'), 'wb') as f:
            f.write(ico_data)
        print(f'Created icon.ico (valid format) - {len(ico_data)} bytes')

# Copy icon.png for .icns (macOS is fine with PNG)
import shutil
shutil.copy(os.path.join(icons_dir, 'icon.png'), os.path.join(icons_dir, 'icon.icns'))
print('Copied to icon.icns')
print('Done!')
