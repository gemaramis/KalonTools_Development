import csv

# 1. Finance Data
finance_months = ['January', 'February', 'Maret', 'April']
finance_revenue = {}

with open('finance_data.csv', 'r') as f:
    reader = list(csv.reader(f))
    # Row 5 (index 4) has Total Revenue
    # Wait, let's look at the head of finance_data.csv:
    # Row 0: Time period:,,,,January,,Time period:,,,,February,,Time period:,,,,Maret,,Time period:,,,,April
    # Row 1: Timezone
    # Row 2: Currency
    # Row 3: empty
    # Row 4: Total settlement amount,,,,5062062427,,Total settlement amount,,,,5442216119...
    # Row 5: ,Total Revenue,,,7890216978,,,Total Revenue,,,8679875182...
    
    # Let's just find the "Total settlement amount" and "Total Revenue"
    for row in reader:
        if "Total settlement amount" in row:
            print("Settlement Row:", row)
        if "Total Revenue" in row:
            print("Revenue Row:", row)
            
# 2. Tiktok Data
with open('data_tiktok.csv', 'r') as f:
    reader = list(csv.reader(f))
    for i, row in enumerate(reader):
        if row and row[0] == "Spending":
            print(f"Spending Row {i}:", row[:35])
        if row and row[0] == "KOL":
            print(f"KOL Row {i}:", row[:35])
        if row and row[0] == "Ongkir":
            print(f"Ongkir Row {i}:", row[:35])
