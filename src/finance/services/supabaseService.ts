
import { supabase } from '../../services/supabase';
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
        const query = supabase.from('fin_account_types').select('*');
        if (businessId) {
            query.or(`business_id.is.null,business_id.eq.${businessId}`);
        } else {
            query.is('business_id', null);
        }
        const { data, error } = await query;

        if (error) throw error;
        return (data || []).map((d: any) => ({
            id: d.id,
            name: d.name,
            description: d.description,
            includeInCashflow: d.include_in_cashflow,
            isActive: d.is_active
        }));
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
        return (data || []).map((d: any) => ({
            id: d.id,
            name: d.name,
            accountTypeId: d.account_type_id,
            currency: d.currency,
            isActive: d.is_active
        }));
    },

    addAccount: async (acc: Partial<Account>, businessId?: string) => {
        const userId = await SupabaseService.private.getUserId();
        const dbObj = {
            name: acc.name,
            account_type_id: acc.accountTypeId,
            currency: acc.currency,
            is_active: acc.isActive,
            user_id: userId,
            business_id: businessId || null
        };
        const { data, error } = await supabase
            .from('fin_accounts')
            .insert([dbObj])
            .select();
        if (error) throw error;
        return data[0];
    },

    updateAccount: async (acc: Account) => {
        const dbObj = {
            name: acc.name,
            account_type_id: acc.accountTypeId,
            currency: acc.currency,
            is_active: acc.isActive
        };
        const { error } = await supabase
            .from('fin_accounts')
            .update(dbObj)
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
        return (data || []).map((d: any) => ({
            id: d.id,
            accountId: d.account_id,
            year: d.year,
            month: d.month,
            amount: d.amount
        }));
    },

    saveMonthlyBalance: async (balance: Partial<MonthlyBalance>, businessId?: string) => {
        const userId = await SupabaseService.private.getUserId();
        const dbObj = {
            id: balance.id,
            account_id: balance.accountId,
            year: balance.year,
            month: balance.month,
            amount: balance.amount,
            user_id: userId,
            business_id: businessId || null
        };
        const { error } = await supabase
            .from('fin_monthly_balances')
            .upsert(dbObj);
        if (error) throw error;
    },

    // --- CATEGORIES ---
    getCategories: async (businessId?: string): Promise<Category[]> => {
        const query = supabase.from('fin_categories').select('*');
        if (businessId) {
            query.or(`business_id.is.null,business_id.eq.${businessId}`);
        } else {
            query.is('business_id', null);
        }
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map((d: any) => ({
            id: d.id,
            name: d.name,
            type: d.type,
            isActive: d.is_active
        }));
    },

    addCategory: async (cat: Partial<Category>, businessId?: string) => {
        const userId = await SupabaseService.private.getUserId();
        const dbObj = {
            name: cat.name,
            type: cat.type,
            is_active: cat.isActive ?? true,
            user_id: userId,
            business_id: businessId || null
        };
        const { data, error } = await supabase
            .from('fin_categories')
            .insert([dbObj])
            .select();
        if (error) throw error;
        return data[0];
    },

    updateCategory: async (cat: Category) => {
        const dbObj = {
            name: cat.name,
            type: cat.type,
            is_active: cat.isActive
        };
        const { error } = await supabase
            .from('fin_categories')
            .update(dbObj)
            .eq('id', cat.id);
        if (error) throw error;
    },

    deleteCategory: async (id: string) => {
        const { error } = await supabase
            .from('fin_categories')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    getSubCategories: async (categoryId: string): Promise<SubCategory[]> => {
        const { data, error } = await supabase
            .from('fin_subcategories')
            .select('*')
            .eq('category_id', categoryId);
        if (error) throw error;
        return (data || []).map((d: any) => ({
            id: d.id,
            categoryId: d.category_id,
            name: d.name,
            isActive: d.is_active
        }));
    },

    getAllSubCategories: async (businessId?: string): Promise<SubCategory[]> => {
        const query = supabase.from('fin_subcategories').select('*, fin_categories!inner(business_id)');
        if (businessId) {
            query.or(`fin_categories.business_id.is.null,fin_categories.business_id.eq.${businessId}`);
        } else {
            query.is('fin_categories.business_id', null);
        }
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map((d: any) => ({
            id: d.id,
            categoryId: d.category_id,
            name: d.name,
            isActive: d.is_active
        }));
    },

    addSubCategory: async (sub: Partial<SubCategory>, businessId?: string) => {
        const userId = await SupabaseService.private.getUserId();
        const dbObj = {
            category_id: sub.categoryId,
            name: sub.name,
            is_active: sub.isActive ?? true,
            user_id: userId,
            business_id: businessId || null
        };
        const { data, error } = await supabase
            .from('fin_subcategories')
            .insert([dbObj])
            .select();
        if (error) throw error;
        return data[0];
    },

    deleteSubCategory: async (id: string) => {
        const { error } = await supabase
            .from('fin_subcategories')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // --- TRANSACTIONS ---
    getTransactions: async (businessId?: string): Promise<Transaction[]> => {
        const query = supabase.from('fin_transactions').select('*');
        if (businessId) query.eq('business_id', businessId);
        else query.is('business_id', null);

        const { data, error } = await query.order('date', { ascending: false });
        if (error) throw error;
        return (data || []).map((d: any) => ({
            id: d.id,
            date: d.date,
            categoryId: d.category_id,
            subCategoryId: d.sub_category_id,
            description: d.description,
            note: d.note,
            amount: d.amount,
            type: d.type,
            accountId: d.account_id
        }));
    },

    addTransaction: async (t: Partial<Transaction>, businessId?: string) => {
        const userId = await SupabaseService.private.getUserId();
        const dbObj = {
            date: t.date,
            category_id: t.categoryId,
            sub_category_id: t.subCategoryId || null,
            description: t.description,
            note: t.note,
            amount: t.amount,
            type: t.type,
            account_id: t.accountId,
            user_id: userId,
            business_id: businessId || null
        };
        const { data, error } = await supabase
            .from('fin_transactions')
            .insert([dbObj])
            .select();
        if (error) throw error;
        return data[0];
    },

    updateTransaction: async (t: Transaction) => {
        const dbObj = {
            date: t.date,
            category_id: t.categoryId,
            sub_category_id: t.subCategoryId || null,
            description: t.description,
            note: t.note,
            amount: t.amount,
            type: t.type,
            account_id: t.accountId
        };
        const { error } = await supabase
            .from('fin_transactions')
            .update(dbObj)
            .eq('id', t.id);
        if (error) throw error;
    },


    // --- TRANSFERS ---
    performTransfer: async (params: {
        fromAccountId: string,
        toAccountId: string,
        amount: number,
        description: string,
        date: string,
        categoryId: string
    }, businessId?: string) => {
        const userId = await SupabaseService.private.getUserId();

        // 1. Transaction OUT (from source)
        const outTransaction = {
            date: params.date,
            category_id: params.categoryId,
            description: `[TRANSFERENCIA SALIDA] ${params.description}`,
            amount: params.amount,
            type: TransactionType.OUT,
            account_id: params.fromAccountId,
            user_id: userId,
            business_id: businessId || null
        };

        // 2. Transaction IN (to destination)
        const inTransaction = {
            date: params.date,
            category_id: params.categoryId,
            description: `[TRANSFERENCIA ENTRADA] ${params.description}`,
            amount: params.amount,
            type: TransactionType.IN,
            account_id: params.toAccountId,
            user_id: userId,
            business_id: businessId || null
        };

        const { error } = await supabase
            .from('fin_transactions')
            .insert([outTransaction, inTransaction]);

        if (error) throw error;
    },

    // --- BUDGET ---
    getBudgetItems: async (businessId?: string): Promise<BudgetItem[]> => {
        const query = supabase.from('fin_budget_items').select('*');
        if (businessId) query.eq('business_id', businessId);
        else query.is('business_id', null);

        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map((d: any) => ({
            id: d.id,
            year: d.year,
            month: d.month,
            categoryId: d.category_id,
            subCategoryId: d.sub_category_id,
            label: d.label,
            type: d.type,
            plannedAmount: d.planned_amount,
            plannedDate: d.planned_date,
            isRecurring: d.is_recurring,
            totalInstallments: d.total_installments,
            currentInstallment: d.current_installment
        }));
    },

    saveBudgetItem: async (item: Partial<BudgetItem>, businessId?: string) => {
        const userId = await SupabaseService.private.getUserId();
        const dbObj = {
            id: item.id,
            year: item.year,
            month: item.month,
            category_id: item.categoryId,
            sub_category_id: item.subCategoryId || null,
            label: item.label,
            type: item.type,
            planned_amount: item.plannedAmount,
            planned_date: item.plannedDate,
            is_recurring: item.isRecurring || false,
            total_installments: item.totalInstallments || 1,
            current_installment: item.currentInstallment || 1,
            user_id: userId,
            business_id: businessId || null
        };
        const { error } = await supabase
            .from('fin_budget_items')
            .upsert(dbObj);
        if (error) throw error;
    },

    // --- JARS ---
    getJars: async (businessId?: string): Promise<Jar[]> => {
        const query = supabase.from('fin_jars').select('*');
        if (businessId) query.eq('business_id', businessId);
        else query.is('business_id', null);

        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map((d: any) => ({
            id: d.id,
            accountId: d.account_id,
            name: d.name,
            startDate: d.start_date,
            endDate: d.end_date,
            principal: d.principal,
            annualRate: d.annual_rate
        }));
    },

    saveJar: async (jar: Partial<Jar>, businessId?: string) => {
        const userId = await SupabaseService.private.getUserId();
        const dbObj = {
            id: jar.id,
            account_id: jar.accountId,
            name: jar.name,
            start_date: jar.startDate,
            end_date: jar.endDate,
            principal: jar.principal,
            annual_rate: jar.annualRate,
            user_id: userId,
            business_id: businessId || null
        };
        const { error } = await supabase
            .from('fin_jars')
            .upsert(dbObj);
        if (error) throw error;
    },

    // --- RULES ---
    getRules: async (businessId?: string): Promise<TextCategoryRule[]> => {
        const query = supabase.from('fin_rules').select('*');
        if (businessId) query.eq('business_id', businessId);
        else query.is('business_id', null);

        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map((d: any) => ({
            id: d.id,
            pattern: d.pattern,
            matchType: d.match_type,
            categoryId: d.category_id,
            subCategoryId: d.sub_category_id,
            direction: d.direction,
            isActive: d.is_active
        }));
    },

    saveRule: async (rule: Partial<TextCategoryRule>, businessId?: string) => {
        const userId = await SupabaseService.private.getUserId();
        const dbObj = {
            id: rule.id,
            pattern: rule.pattern,
            match_type: rule.matchType,
            category_id: rule.categoryId,
            sub_category_id: rule.subCategoryId || null,
            direction: rule.direction,
            is_active: rule.isActive ?? true,
            user_id: userId,
            business_id: businessId || null
        };
        const { error } = await supabase
            .from('fin_rules')
            .upsert(dbObj);
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
