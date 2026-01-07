
import { supabase } from './supabaseClient';
import {
    Account,
    AccountType,
    BudgetItem,
    Category,
    Jar,
    MonthlyBalance,
    SubCategory,
    TextCategoryRule,
    Transaction,
    TransactionType
} from '../financeTypes';

export const SupabaseService = {
    // --- CONTEXT HELPERS ---
    private: {
        async getUserId() {
            const { data: { user } } = await supabase.auth.getUser();
            return user?.id;
        }
    },

    // --- ACCOUNT TYPES ---
    getAccountTypes: async (businessId?: string): Promise<AccountType[]> => {
        const { data, error } = await supabase
            .from('fin_account_types')
            .select('*')
            .or(`business_id.is.null,business_id.eq.${businessId || 'null'}`);

        if (error) throw error;
        return data as AccountType[];
    },

    // --- ACCOUNTS (CAJAS) ---
    getAccounts: async (businessId?: string): Promise<Account[]> => {
        const query = supabase.from('fin_accounts').select('*');
        if (businessId) {
            query.eq('business_id', businessId);
        } else {
            query.is('business_id', null);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data as Account[];
    },

    addAccount: async (acc: Partial<Account>, businessId?: string) => {
        const userId = await SupabaseService.private.getUserId();
        const { data, error } = await supabase
            .from('fin_accounts')
            .insert([{ ...acc, user_id: userId, business_id: businessId || null }])
            .select();
        if (error) throw error;
        return data[0];
    },

    updateAccount: async (acc: Account) => {
        const { error } = await supabase
            .from('fin_accounts')
            .update(acc)
            .eq('id', acc.id);
        if (error) throw error;
    },

    deleteAccount: async (id: string) => {
        const { error } = await supabase
            .from('fin_accounts')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // --- MONTHLY BALANCES ---
    getMonthlyBalances: async (businessId?: string): Promise<MonthlyBalance[]> => {
        const query = supabase.from('fin_monthly_balances').select('*');
        if (businessId) query.eq('business_id', businessId);
        else query.is('business_id', null);

        const { data, error } = await query;
        if (error) throw error;
        return data as MonthlyBalance[];
    },

    saveMonthlyBalance: async (balance: Partial<MonthlyBalance>, businessId?: string) => {
        const userId = await SupabaseService.private.getUserId();
        const { error } = await supabase
            .from('fin_monthly_balances')
            .upsert({ ...balance, user_id: userId, business_id: businessId || null });
        if (error) throw error;
    },

    // --- CATEGORIES ---
    getCategories: async (businessId?: string): Promise<Category[]> => {
        const { data, error } = await supabase
            .from('fin_categories')
            .select('*')
            .or(`business_id.is.null,business_id.eq.${businessId || 'null'}`);
        if (error) throw error;
        return data as Category[];
    },

    getSubCategories: async (categoryId: string): Promise<SubCategory[]> => {
        const { data, error } = await supabase
            .from('fin_subcategories')
            .select('*')
            .eq('category_id', categoryId);
        if (error) throw error;
        return data as SubCategory[];
    },

    getAllSubCategories: async (businessId?: string): Promise<SubCategory[]> => {
        const { data, error } = await supabase
            .from('fin_subcategories')
            .select('*, fin_categories!inner(business_id)')
            .or(`fin_categories.business_id.is.null,fin_categories.business_id.eq.${businessId || 'null'}`);
        if (error) throw error;
        return data as any[];
    },

    // --- TRANSACTIONS ---
    getTransactions: async (businessId?: string): Promise<Transaction[]> => {
        const query = supabase.from('fin_transactions').select('*');
        if (businessId) query.eq('business_id', businessId);
        else query.is('business_id', null);

        const { data, error } = await query.order('date', { ascending: false });
        if (error) throw error;
        return data as Transaction[];
    },

    addTransaction: async (t: Partial<Transaction>, businessId?: string) => {
        const userId = await SupabaseService.private.getUserId();
        const { data, error } = await supabase
            .from('fin_transactions')
            .insert([{ ...t, user_id: userId, business_id: businessId || null }])
            .select();
        if (error) throw error;
        return data[0];
    },

    // --- BUDGET ---
    getBudgetItems: async (businessId?: string): Promise<BudgetItem[]> => {
        const query = supabase.from('fin_budget_items').select('*');
        if (businessId) query.eq('business_id', businessId);
        else query.is('business_id', null);

        const { data, error } = await query;
        if (error) throw error;
        return data as BudgetItem[];
    },

    saveBudgetItem: async (item: Partial<BudgetItem>, businessId?: string) => {
        const userId = await SupabaseService.private.getUserId();
        const { error } = await supabase
            .from('fin_budget_items')
            .upsert({ ...item, user_id: userId, business_id: businessId || null });
        if (error) throw error;
    },

    // --- JARS ---
    getJars: async (businessId?: string): Promise<Jar[]> => {
        const query = supabase.from('fin_jars').select('*');
        if (businessId) query.eq('business_id', businessId);
        else query.is('business_id', null);

        const { data, error } = await query;
        if (error) throw error;
        return data as Jar[];
    },

    saveJar: async (jar: Partial<Jar>, businessId?: string) => {
        const userId = await SupabaseService.private.getUserId();
        const { error } = await supabase
            .from('fin_jars')
            .upsert({ ...jar, user_id: userId, business_id: businessId || null });
        if (error) throw error;
    },

    // --- RULES ---
    getRules: async (businessId?: string): Promise<TextCategoryRule[]> => {
        const query = supabase.from('fin_rules').select('*');
        if (businessId) query.eq('business_id', businessId);
        else query.is('business_id', null);

        const { data, error } = await query;
        if (error) throw error;
        return data as TextCategoryRule[];
    },

    saveRule: async (rule: Partial<TextCategoryRule>, businessId?: string) => {
        const userId = await SupabaseService.private.getUserId();
        const { error } = await supabase
            .from('fin_rules')
            .upsert({ ...rule, user_id: userId, business_id: businessId || null });
        if (error) throw error;
    },

    deleteRule: async (id: string) => {
        const { error } = await supabase
            .from('fin_rules')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    deleteBudgetItem: async (id: string) => {
        const { error } = await supabase
            .from('fin_budget_items')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    deleteJar: async (id: string) => {
        const { error } = await supabase
            .from('fin_jars')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    deleteTransaction: async (id: string) => {
        const { error } = await supabase
            .from('fin_transactions')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
