import pandas as pd
import uuid
import json

def generate_migration_sql(excel_path, output_sql):
    df_dict = pd.read_excel(excel_path, sheet_name=None)
    sql_commands = []
    
    # We'll use these to track IDs
    category_map = {}
    subcategory_map = {}
    account_map = {}

    # Define months to import
    target_months = {"OCTUBRE": 10, "NOVIEMBRE": 11} # Using 1-based for the script, will convert to 0-based for DB if needed

    for sheet_name in target_months:
        if sheet_name not in df_dict:
            continue
            
        df = df_dict[sheet_name]
        month_idx = target_months[sheet_name] - 1 # 0-indexed for DB
        year = 2025 # Based on file data

        # 1. Process Accounts (Cajas) - Found in columns 23 onwards in the sample
        # Let's look for known headers
        for col in df.columns:
            if str(df[col].iloc[0]).startswith("CTA") or str(df[col].iloc[0]).startswith("EFECTIVO"):
                acc_name = str(df[col].iloc[0])
                if acc_name not in account_map:
                    acc_id = str(uuid.uuid4())
                    account_map[acc_name] = acc_id
                    sql_commands.append(f"INSERT INTO public.fin_accounts (id, name, is_active) VALUES ('{acc_id}', '{acc_name}', true) ON CONFLICT DO NOTHING;")

        # 2. Process Expenses (Columns 0-6: FECHA, DATO FECHA, RUBRO, SUB RUBRO, PRESUPUESTO, PAGADO)
        for idx, row in df.iterrows():
            if pd.isna(row['FECHA']) or str(row['FECHA']) == 'nan':
                continue
            
            rubro = str(row['RUBRO'])
            sub_rubro = str(row['SUB RUBRO'])
            planned = row['PRESUPUESTO']
            actual = row['PAGADO']
            date = str(row['FECHA'])

            if rubro == 'nan': continue

            # Get Category ID (Mock or created via sync script)
            # In this script we'll generate INSERTs for everything for safety
            cat_key = f"OUT_{rubro}"
            if cat_key not in category_map:
                cat_id = str(uuid.uuid4())
                category_map[cat_key] = cat_id
                sql_commands.append(f"INSERT INTO public.fin_categories (id, name, type) VALUES ('{cat_id}', '{rubro}', 'OUT') ON CONFLICT DO NOTHING;")
            
            cat_id = category_map[cat_key]

            sub_id = None
            if sub_rubro != 'nan':
                sub_key = f"{cat_id}_{sub_rubro}"
                if sub_key not in subcategory_map:
                    sub_id = str(uuid.uuid4())
                    subcategory_map[sub_key] = sub_id
                    sql_commands.append(f"INSERT INTO public.fin_subcategories (id, category_id, name) VALUES ('{sub_id}', '{cat_id}', '{sub_rubro}') ON CONFLICT DO NOTHING;")
                sub_id = subcategory_map[sub_key]

            # Budget Item
            if planned > 0:
                day = 1 # Default
                try: day = int(row['DATO FECHA'])
                except: pass
                sub_id_val = f"'{sub_id}'" if sub_id else "NULL"
                sql_commands.append(f"INSERT INTO public.fin_budget_items (year, month, category_id, sub_category_id, label, type, planned_amount, planned_date) VALUES ({year}, {month_idx}, '{cat_id}', {sub_id_val}, '{sub_rubro if sub_rubro != 'nan' else rubro}', 'OUT', {planned}, {day});")

            # Actual Transaction
            if actual > 0:
                # We need a default account for transactions if not specified in the row
                # Let's assume EFECTIVO if not sure
                def_acc = account_map.get('EFECTIVO', '00000000-0000-0000-0000-000000000000')
                sub_id_val = f"'{sub_id}'" if sub_id else "NULL"
                sql_commands.append(f"INSERT INTO public.fin_transactions (date, category_id, sub_category_id, description, amount, type, account_id) VALUES ('{date[:10]}', '{cat_id}', {sub_id_val}, '{sub_rubro if sub_rubro != 'nan' else rubro}', {actual}, 'OUT', '{def_acc}');")

        # 3. Process Income (Columns 9-14: FECHA.1, DATO, INGRESO, PRESUPUESTO.1, COBRADO)
        # We need to map these correctly as pandas might have renamed them
        # Typically FECHA.1, INGRESO, PRESUPUESTO.1, COBRADO
        for idx, row in df.iterrows():
            if 'FECHA.1' not in row or pd.isna(row['FECHA.1']) or str(row['FECHA.1']) == 'nan' or str(row['FECHA.1']) == 'Total':
                continue
            
            rubro = "INGRESOS" # Root for income in Excel layout
            sub_rubro = str(row['INGRESO'])
            planned = row['PRESUPUESTO.1']
            actual = row['COBRADO']
            date = str(row['FECHA.1'])

            if sub_rubro == 'nan': continue

            cat_key = f"IN_{rubro}"
            if cat_key not in category_map:
                cat_id = str(uuid.uuid4())
                category_map[cat_key] = cat_id
                sql_commands.append(f"INSERT INTO public.fin_categories (id, name, type) VALUES ('{cat_id}', '{rubro}', 'IN') ON CONFLICT DO NOTHING;")
            
            cat_id = category_map[cat_key]

            sub_key = f"{cat_id}_{sub_rubro}"
            if sub_key not in subcategory_map:
                sub_id = str(uuid.uuid4())
                subcategory_map[sub_key] = sub_id
                sql_commands.append(f"INSERT INTO public.fin_subcategories (id, category_id, name) VALUES ('{sub_id}', '{cat_id}', '{sub_rubro}') ON CONFLICT DO NOTHING;")
            sub_id = subcategory_map[sub_key]

            # Budget Item
            if planned > 0:
                day = 1
                try: day = int(row['DATO'])
                except: pass
                sub_id_val = f"'{sub_id}'" if sub_id else "NULL"
                sql_commands.append(f"INSERT INTO public.fin_budget_items (year, month, category_id, sub_category_id, label, type, planned_amount, planned_date) VALUES ({year}, {month_idx}, '{cat_id}', {sub_id_val}, '{sub_rubro}', 'IN', {planned}, {day});")

            # Actual Transaction
            if actual > 0:
                def_acc = account_map.get('EFECTIVO', '00000000-0000-0000-0000-000000000000')
                sub_id_val = f"'{sub_id}'" if sub_id else "NULL"
                sql_commands.append(f"INSERT INTO public.fin_transactions (date, category_id, sub_category_id, description, amount, type, account_id) VALUES ('{date[:10]}', '{cat_id}', {sub_id_val}, '{sub_rubro}', {actual}, 'IN', '{def_acc}');")

    with open(output_sql, 'w', encoding='utf-8') as f:
        f.write("\n".join(sql_commands))
    print(f"Migration SQL generated at {output_sql}")

if __name__ == "__main__":
    generate_migration_sql('presupuesto.xlsx', 'database/migration_history.sql')
