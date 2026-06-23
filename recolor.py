from PIL import Image

def recolor_image(input_path, output_path, target_color_hex):
    try:
        img = Image.open(input_path).convert("RGBA")
        data = img.getdata()

        # target color #c0d29a
        target_r = int(target_color_hex[1:3], 16)
        target_g = int(target_color_hex[3:5], 16)
        target_b = int(target_color_hex[5:7], 16)

        new_data = []
        for item in data:
            r, g, b, a = item
            # The original logo is brown on white
            # Let's consider anything darker than very light gray as the logo
            if r < 220 and g < 220 and b < 220 and a > 0:
                new_data.append((target_r, target_g, target_b, a))
            else:
                new_data.append(item)

        img.putdata(new_data)
        img.save(output_path, format="ICO")
        print(f"Successfully saved recolored favicon to {output_path}")
    except Exception as e:
        print(f"Error: {e}")

recolor_image('public/favicon.jpg', 'public/favicon.ico', '#c0d29a')
