import os
import re
import json
import argparse
import sys

def parse_sound_file(filepath):
    """
    Parses a single sound data file to extract real and imag arrays.
    Assumes a JavaScript object literal format like:
    { 'real': [num, num,...], 'imag': [num, num,...] }
    Handles single quotes for keys and trailing commas within the structure.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Basic check for expected structure
        if not content.strip().startswith('{') or not content.strip().endswith('}'):
             print(f"Warning: Content does not appear to be a JS object literal in {filepath}", file=sys.stderr)
             return None

        # --- Prepare for JSON parsing ---
        # 1. Replace single quotes used for keys with double quotes
        json_text = content.replace("'real'", '"real"')
        json_text = json_text.replace("'imag'", '"imag"')

        # 2. Remove potential trailing commas before closing brackets ']' and braces '}'
        #    This makes it valid JSON. Uses regex lookahead/lookbehind might be safer,
        #    but this simpler substitution often works for this specific format.
        json_text = re.sub(r",(\s*\])", r"\1", json_text) # Comma before ]
        json_text = re.sub(r",(\s*\})", r"\1", json_text) # Comma before }

        # 3. Parse the cleaned-up text as JSON
        data = json.loads(json_text)

        # 4. Validate structure
        if 'real' not in data or 'imag' not in data:
             print(f"Warning: Parsed data missing 'real' or 'imag' key in {filepath}", file=sys.stderr)
             return None
        if not isinstance(data['real'], list) or not isinstance(data['imag'], list):
             print(f"Warning: 'real' or 'imag' is not a list in {filepath}", file=sys.stderr)
             return None

        # Optional: Validate that lists contain only numbers
        if not all(isinstance(x, (int, float)) for x in data['real']):
            print(f"Warning: Non-numeric data found in 'real' list in {filepath}", file=sys.stderr)
            # Decide if this is an error or just a warning
            # return None # Uncomment to treat as error
        if not all(isinstance(x, (int, float)) for x in data['imag']):
            print(f"Warning: Non-numeric data found in 'imag' list in {filepath}", file=sys.stderr)
            # Decide if this is an error or just a warning
            # return None # Uncomment to treat as error

        return data

    except FileNotFoundError:
        print(f"Error: File not found {filepath}", file=sys.stderr)
        return None
    except IOError as e:
        print(f"Error: Could not read file {filepath}: {e}", file=sys.stderr)
        return None
    except json.JSONDecodeError as e:
        print(f"Warning: Failed to parse content from {filepath} as JSON after cleanup: {e}", file=sys.stderr)
        # For debugging, you might want to print the text that failed:
        # print(f"------ Problematic Text Start ------\n{json_text[max(0, e.pos-50):e.pos+50]}\n------ Problematic Text End ------")
        return None
    except Exception as e:
        # Catch any other unexpected errors during processing
        print(f"Error: Unexpected error processing file {filepath}: {e}", file=sys.stderr)
        return None


def main():
    parser = argparse.ArgumentParser(description="Parse JS sound data files and combine them into a single JS file.")
    parser.add_argument("input_dir", help="Directory containing the sound data files (e.g., 'sound/').")
    parser.add_argument("output_file", help="Path for the output JavaScript file (e.g., 'waveTableData.js').")
    args = parser.parse_args()

    input_dir = args.input_dir
    output_file = args.output_file

    if not os.path.isdir(input_dir):
        print(f"Error: Input directory '{input_dir}' not found or is not a directory.", file=sys.stderr)
        sys.exit(1)

    all_data = []
    # Sort filenames for consistent output order
    try:
        filenames = sorted(os.listdir(input_dir))
    except OSError as e:
        print(f"Error: Could not list directory '{input_dir}': {e}", file=sys.stderr)
        sys.exit(1)


    print(f"Processing files in '{input_dir}'...")
    processed_files = 0
    skipped_files = 0
    for filename in filenames:
        filepath = os.path.join(input_dir, filename)
        if os.path.isfile(filepath):
            print(f"  Parsing '{filename}'...")
            parsed_data = parse_sound_file(filepath)
            if parsed_data:
                all_data.append({
                    "filename": filename,
                    "real": parsed_data["real"],
                    "imag": parsed_data["imag"]
                })
                processed_files += 1
            else:
                skipped_files += 1
        # else: # Skip directories or other non-files silently
        #    pass

    if processed_files == 0:
        print("\nWarning: No valid sound data files were successfully processed.", file=sys.stderr)
    else:
        print(f"\nSuccessfully processed {processed_files} file(s).")
    if skipped_files > 0:
         print(f"Skipped {skipped_files} file(s) due to errors or format issues.")


    print(f"Generating JavaScript output file '{output_file}'...")

    js_output_lines = []
    js_output_lines.append("// Generated by script. Contains combined wavetable data.")
    js_output_lines.append("const waveTableData = [")

    for i, item in enumerate(all_data):
        # Use json.dumps for reliable JS formatting of strings and lists.
        # Use compact separators for arrays to keep them shorter.
        filename_json = json.dumps(item['filename'])
        real_json = json.dumps(item['real'], separators=(',', ':'))
        imag_json = json.dumps(item['imag'], separators=(',', ':'))

        js_output_lines.append("  {")
        js_output_lines.append(f"    filename: {filename_json},")
        js_output_lines.append(f"    real: {real_json},")
        js_output_lines.append(f"    imag: {imag_json}")
        # Add comma after object unless it's the last one
        js_output_lines.append("  }" + ("," if i < len(all_data) - 1 else ""))

    js_output_lines.append("];")
    # Add export if needed for module systems (optional)
    # js_output_lines.append("\nexport default waveTableData;")
    js_output_lines.append("") # Add a trailing newline for POSIX compatibility

    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("\n".join(js_output_lines))
        print(f"Successfully created '{output_file}'.")
    except IOError as e:
        print(f"Error: Could not write to output file '{output_file}': {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
