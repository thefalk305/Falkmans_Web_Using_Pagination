# This script copies the 'famSrchLink' field from the excel 
# file to a json file if the names in both files match.

import json
import pandas as pd

# Load Excel data
excel_df = pd.read_excel('./data/InfoTableData2.xlsx')

# Normalize names for matching (strip whitespace, lowercase)
excel_df['name'] = excel_df['name'].str.strip().str.lower()
excel_lookup = dict(zip(excel_df['name'], excel_df['famSrchLink']))

# Load JSON data
with open('./data/PhotoPagesData-2.json', 'r', encoding='utf-8') as f:
    json_data = json.load(f)

# Track how many updates we make
update_count = 0

# Update JSON records
for record in json_data:
    json_name = record.get('name', '').strip().lower()
    if json_name in excel_lookup:
        record['famSrchLink'] = excel_lookup[json_name]
        update_count += 1

# Save updated JSON
with open('./data/PhotoPagesData-2-updated.json', 'w', encoding='utf-8') as f:
    json.dump(json_data, f, indent=2, ensure_ascii=False)

print(f"Updated {update_count} records with famSrchLink from Excel.")