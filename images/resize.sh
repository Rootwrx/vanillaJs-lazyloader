#!/bin/bash

# Ensure we're in the correct directory
# Replace '/path/to/your/image/folder' with the actual path to your folder

for file in *mobile*; do
    # Check if the file is an image (you can add more extensions if needed)
    if [[ $file == *.jpg || $file == *.jpeg || $file == *.png ]]; then
        # Get the file name without extension
        filename="${file%.*}"

        # Create the new file name
        newfile="${filename}_blurred.${file##*.}"

        # Use FFmpeg to create the small, blurred image
        ffmpeg -i "$file" -vf "scale=5:-1,scale=5:-1:flags=neighbor" -q:v 2 "$newfile"

        echo "Processed $file to $newfile"
    fi
done

echo "All done!"
