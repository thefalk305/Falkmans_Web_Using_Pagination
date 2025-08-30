import json

# Load your JSON data
with open('./data/PhotoPagesData.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
# Sort by 'born'
sorted_data = sorted(data, key=lambda x: x['born'])

# Save the sorted result
with open('./data/sorted.json', 'w') as f:
    json.dump(sorted_data, f, indent=2)