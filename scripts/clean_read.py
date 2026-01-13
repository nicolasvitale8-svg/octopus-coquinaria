import pandas as pd

try:
    xl = pd.ExcelFile('presupuesto.xlsx')
    for sheet in xl.sheet_names:
        print(f"--- Sheet: {sheet} ---")
        df = pd.read_excel('presupuesto.xlsx', sheet_name=sheet)
        # Filter rows where at least some columns have data
        df_clean = df.dropna(how='all', axis=0).dropna(how='all', axis=1)
        print(df_clean.head(50).to_string())
        print("\n")
except Exception as e:
    print(f"Error: {e}")
