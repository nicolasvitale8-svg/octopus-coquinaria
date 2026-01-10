import pandas as pd

try:
    df = pd.read_excel('presupuesto.xlsx', sheet_name='ENERO')
    pd.set_option('display.max_columns', None)
    pd.set_option('display.max_rows', None)
    pd.set_option('display.width', 1000)
    print(df.to_string())
except Exception as e:
    print(f"Error: {e}")
