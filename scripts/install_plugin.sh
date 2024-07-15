#!/bin/bash

set -euo pipefail

url=""
overwrite=false
destination=""

# Parse command-line options
while [[ $# -gt 0 ]]; do
  case $1 in
    -u|--url)
      shift
      url=$1
      shift
      ;;
    -d|--destination)
      shift
      destination=$1
      shift
      ;;
    --overwrite)
      shift
      overwrite=$1
      shift
      ;;
    *)
      break
      ;;
  esac
done

# Check if the url is empty
if [ -z "$url" ]; then
  echo "Error: --url must be provided!"
  exit 1
fi

# Set the default destination directory relative to the script location or the provided directory
if [ -z "$destination" ]; then
  destination="$(pwd)/plugins"
fi

# Create a temporary directory
temp_dir=$(mktemp -d)

# Download / copy the compressed file to the temporary directory
if [[ $url == http* ]]; then
  # Check if the URL exists
  response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [[ $response_code != 200 && $response_code != 3* ]]; then
    echo "Error: Failed to download the plugin! URL does not exist or returned an error. Response code: $response_code"
    exit 1
  fi

  echo "Downloading plugin from: $url"
  curl -s -L -o "$temp_dir/plugin" "$url"
  if [ $? -ne 0 ]; then
    echo "Error: Failed to download the plugin!"
    exit 1
  fi
else
  if [ ! -f "$url" ]; then
    echo "Error: Source file does not exist!"
    exit 1
  fi

  cp "$url" "$temp_dir/plugin"
fi

mkdir -p "$temp_dir/plugin-contents"

# Extract the zip or tar.gz file to the temporary directory
if [[ $url == *.zip ]]; then
  unzip -q "$temp_dir/plugin" -d "$temp_dir/plugin-contents"
elif [[ $url == *.tar.gz ]]; then
  tar -xzf "$temp_dir/plugin" -C "$temp_dir/plugin-contents"
else
  echo "Error: Unsupported file format!"
  exit 1
fi

if [ $? -ne 0 ]; then
  echo "Error: Failed to extract the compressed file!"
  exit 1
fi

# find the folder wich contains the plugin manifest
plugin_folder=$(dirname $(find $temp_dir/plugin-contents -name "mf-manifest.json" -print -quit))

# Check if the unzipped file contains mf-manifest.json
if [ ! -f "$plugin_folder/mf-manifest.json" ]; then
  echo "Error: mf-manifest.json not found in the plugin files!"
  exit 1
fi

# Extract the plugin name from mf-manifest.json
plugin_name=$(jq -r '.name' "$plugin_folder/mf-manifest.json")

# Check if the plugin name is empty
if [ -z "$plugin_name" ]; then
  echo "Error: Failed to extract plugin name from mf-manifest.json!"
  exit 1
fi

# Check if the plugin is already installed
if [ -f "$destination/$plugin_name/mf-manifest.json" ]; then
  if [ "$overwrite" = true ]; then
    # Remove the existing plugin directory
    rm -rf "$destination/$plugin_name"
  else
    echo "Plugin $plugin_name is already installed. Use the '--overwrite true' option to overwrite."
    exit 0
  fi
fi

# Check if the destination directory exists, if not create it
if [ ! -d "$destination/$plugin_name" ]; then
  mkdir -p "$destination/$plugin_name"
fi

# Copy the extracted files to the destination directory with the plugin name as a folder
cp -r "$plugin_folder"/* "$destination/$plugin_name"

# Clean up the temporary directory
rm -rf "$temp_dir"

echo "Plugin $plugin_name installed successfully: $destination/$plugin_name"
