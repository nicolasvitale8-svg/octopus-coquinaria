import {
    Account,
    AccountType,
    BudgetItem,
    Category,
    Jar,
    MonthlyBalance,
    SubCategory,
    TextCategoryRule,
    Transaction
} from '../financeTypes';

export interface IFinanceService {
    getUserId(): Promise<string | null>;

    // Accounts
    getAccountTypes(businessId?: string): Promise<AccountType[]>;
    getAccounts(businessId?: string): Promise<Account[]>;
    addAccount(acc: Partial<Account>, businessId?: string): Promise<Account>;
    updateAccount(acc: Account): Promise<void>;
    deleteAccount(id: string): Promise<void>;

    // Monthly Balances
    getMonthlyBalances(businessId?: string): Promise<MonthlyBalance[]>;
    saveMonthlyBalance(balance: Partial<MonthlyBalance>, businessId?: string): Promise<void>;

    // Categories
    getCategories(businessId?: string): Promise<Category[]>;
    addCategory(cat: Partial<Category>, businessId?: string): Promise<Category>;
    updateCategory(cat: Category): Promise<void>;
    deleteCategory(id: string): Promise<void>;

    // SubCategories
    getSubCategories(categoryId: string): Promise<SubCategory[]>;
    getAllSubCategories(businessId?: string): Promise<SubCategory[]>;
    addSubCategory(sub: Partial<SubCategory>, businessId?: string): Promise<SubCategory>;
    deleteSubCategory(id: string): Promise<void>;

    // Transactions
    getTransactions(businessId?: string): Promise<Transaction[]>;
    addTransaction(t: Partial<Transaction>, businessId?: string): Promise<Transaction>;
    updateTransaction(t: Transaction): Promise<void>;
    deleteTransaction(id: string): Promise<void>;

    // Transfers
    performTransfer(params: {
        fromAccountId: string;
        toAccountId: string;
        amount: number;
        description: string;
        date: string;
        categoryId: string;
    }, businessId?: string): Promise<void>;

    // Budget
    getBudgetItems(businessId?: string): Promise<BudgetItem[]>;
    saveBudgetItem(item: Partial<BudgetItem>, businessId?: string): Promise<void>;
    deleteBudgetItem(id: string): Promise<void>;

    // Jars
    getJars(businessId?: string): Promise<Jar[]>;
    saveJar(jar: Partial<Jar>, businessId?: string): Promise<void>;
    deleteJar(id: string): Promise<void>;

    // Rules
    getRules(businessId?: string): Promise<TextCategoryRule[]>;
    saveRule(rule: Partial<TextCategoryRule>, businessId?: string): Promise<void>;
    deleteRule(id: string): Promise<void>;
}
