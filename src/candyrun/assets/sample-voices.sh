# Define the specific voices and candy texts
voices=(
  # "Daniel" "Moira" "Wobble" "Tessa" "Rishi" 
"Samantha")
candies=("Kit Kat" 
# "Milky Way" "Skittles" "Snickers" "Sour Patch"
)

for voice in "${voices[@]}"; do
    echo "Processing voice: $voice"
    
    # Create the subdirectory named after the voice if it doesn't exist
    mkdir -p "$voice"
    
    for candy in "${candies[@]}"; do
        # Generate the file name (replacing spaces with underscores for clean file management)
        clean_name=$(echo "$candy" | tr ' ' '_')
        file_path="${voice}/${clean_name}.m4a"
        
        # Speak the text using the designated voice and save it to the subdirectory
        say -v "$voice" "$candy" -o "$file_path"
    done
done

echo "Done! Folders and audio clips generated successfully."
