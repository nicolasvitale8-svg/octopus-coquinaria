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
import { IFinanceService } from './IFinanceService';

const uuidv4 = () => crypto.randomUUID();

// --- MOCKED DATA GENITORS ---

const MOCK_ACCOUNT_TYPES: AccountType[] = [
    { id: 'at_bank', name: 'Banco', includeInCashflow: true, isActive: true },
    { id: 'at_cash', name: 'Efectivo', includeInCashflow: true, isActive: true },
    { id: 'at_wallet', name: 'Billetera Virtual', includeInCashflow: true, isActive: true },
];

const MOCK_ACCOUNTS: Account[] = [
    { id: 'd_acc_1', name: 'Banco Galicia', accountTypeId: 'at_bank', currency: 'ARS', isActive: true },
    { id: 'd_acc_2', name: 'Mercado Pago', accountTypeId: 'at_wallet', currency: 'ARS', isActive: true },
    { id: 'd_acc_3', name: 'Caja Chica', accountTypeId: 'at_cash', currency: 'ARS', isActive: true },
];

const MOCK_CATEGORIES: Category[] = [
    { id: 'd_cat_1', name: 'Ventas', type: TransactionType.IN, isActive: true },
    { id: 'd_cat_2', name: 'Proveedores', type: TransactionType.OUT, isActive: true },
    { id: 'd_cat_3', name: 'Servicios', type: TransactionType.OUT, isActive: true },
    { id: 'd_cat_4', name: 'Sueldos', type: TransactionType.OUT, isActive: true },
];

const MOCK_SUBCATEGORIES: SubCategory[] = [
    { id: 'd_sub_1', categoryId: 'd_cat_3', name: 'Internet', isActive: true },
    { id: 'd_sub_2', categoryId: 'd_cat_3', name: 'Luz', isActive: true },
];

const MOCK_TRANSACTIONS: Transaction[] = [
    {
        id: 'd_tx_1',
        date: new Date().toISOString().split('T')[0],
        categoryId: 'd_cat_1',
        description: 'Venta del día',
        amount: 50000,
        type: TransactionType.IN,
        accountId: 'd_acc_2'
    },
    {
        id: 'd_tx_2',
        date: new Date().toISOString().split('T')[0],
        categoryId: 'd_cat_3',
        subCategoryId: 'd_sub_1',
        description: 'Pago Fibertel',
        amount: 4500,
        type: TransactionType.OUT,
        accountId: 'd_acc_1'
    }
];

export class DemoFinanceService implements IFinanceService {
    // In-memory state for the demo session
    private accounts: Account[] = [...MOCK_ACCOUNTS];
    private categories: Category[] = [...MOCK_CATEGORIES];
    private subCategories: SubCategory[] = [...MOCK_SUBCATEGORIES];
    private transactions: Transaction[] = [...MOCK_TRANSACTIONS];
    private balances: MonthlyBalance[] = [];
    private budgetItems: BudgetItem[] = [];
    private jars: Jar[] = [];
    private rules: TextCategoryRule[] = [];

    async getUserId(): Promise<string | null> {
        return 'demo-user-id';
    }

    // --- ACCOUNTS ---
    async getAccountTypes(businessId?: string): Promise<AccountType[]> {
        return MOCK_ACCOUNT_TYPES;
    }

    async getAccounts(businessId?: string): Promise<Account[]> {
        return this.accounts;
    }

    async addAccount(acc: Partial<Account>, businessId?: string): Promise<Account> {
        const newAcc = {
            ...acc,
            id: uuidv4(),
            isActive: true
        } as Account;
        this.accounts.push(newAcc);
        return newAcc;
    }

    async updateAccount(acc: Account): Promise<void> {
        this.accounts = this.accounts.map(a => a.id === acc.id ? acc : a);
    }

    async deleteAccount(id: string): Promise<void> {
        this.accounts = this.accounts.filter(a => a.id !== id);
    }

    // --- MONTHLY BALANCES ---
    async getMonthlyBalances(businessId?: string): Promise<MonthlyBalance[]> {
        return this.balances;
    }

    async saveMonthlyBalance(balance: Partial<MonthlyBalance>, businessId?: string): Promise<void> {
        const existingIndex = this.balances.findIndex(
            b => b.accountId === balance.accountId && b.month === balance.month && b.year === balance.year
        );

        if (existingIndex >= 0) {
            this.balances[existingIndex] = { ...this.balances[existingIndex], ...balance };
        } else {
            this.balances.push({
                id: uuidv4(),
                accountId: balance.accountId!,
                month: balance.month!,
                year: balance.year!,
                amount: balance.amount || 0
            });
        }
    }

    // --- CATEGORIES ---
    async getCategories(businessId?: string): Promise<Category[]> {
        return this.categories;
    }

    async addCategory(cat: Partial<Category>, businessId?: string): Promise<Category> {
        const newCat = {
            ...cat,
            id: uuidv4(),
            isActive: true
        } as Category;
        this.categories.push(newCat);
        return newCat;
    }

    async updateCategory(cat: Category): Promise<void> {
        this.categories = this.categories.map(c => c.id === cat.id ? cat : c);
    }

    async deleteCategory(id: string): Promise<void> {
        this.categories = this.categories.filter(c => c.id !== id);
    }

    // --- SUBCATEGORIES ---
    async getSubCategories(categoryId: string): Promise<SubCategory[]> {
        return this.subCategories.filter(s => s.categoryId === categoryId);
    }

    async getAllSubCategories(businessId?: string): Promise<SubCategory[]> {
        return this.subCategories;
    }

    async addSubCategory(sub: Partial<SubCategory>, businessId?: string): Promise<SubCategory> {
        const newSub = {
            ...sub,
            id: uuidv4(),
            isActive: true
        } as SubCategory;
        this.subCategories.push(newSub);
        return newSub;
    }

    async deleteSubCategory(id: string): Promise<void> {
        this.subCategories = this.subCategories.filter(s => s.id !== id);
    }

    // --- TRANSACTIONS ---
    async getTransactions(businessId?: string): Promise<Transaction[]> {
        return this.transactions;
    }

    async addTransaction(t: Partial<Transaction>, businessId?: string): Promise<Transaction> {
        const newTx = {
            ...t,
            id: uuidv4()
        } as Transaction;
        this.transactions.push(newTx);
        return newTx;
    }

    async updateTransaction(t: Transaction): Promise<void> {
        this.transactions = this.transactions.map(Tx => Tx.id === t.id ? t : Tx);
    }

    async deleteTransaction(id: string): Promise<void> {
        this.transactions = this.transactions.filter(t => t.id !== id);
    }

    // --- TRANSFERS ---
    async performTransfer(params: {
        fromAccountId: string;
        toAccountId: string;
        amount: number;
        description: string;
        date: string;
        categoryId: string;
    }, businessId?: string): Promise<void> {
        const debit: Transaction = {
            id: uuidv4(),
            accountId: params.fromAccountId,
            amount: params.amount,
            date: params.date,
            type: TransactionType.OUT,
            categoryId: params.categoryId,
            description: `Transferencia a: ${params.description}`,
        };

        const credit: Transaction = {
            id: uuidv4(),
            accountId: params.toAccountId,
            amount: params.amount,
            date: params.date,
            type: TransactionType.IN,
            categoryId: params.categoryId,
            description: `Transferencia desde: ${params.description}`,
        };

        this.transactions.push(debit, credit);
    }

    // --- BUDGET ---
    async getBudgetItems(businessId?: string): Promise<BudgetItem[]> {
        return this.budgetItems;
    }

    async saveBudgetItem(item: Partial<BudgetItem>, businessId?: string): Promise<void> {
        if (item.id) {
            this.budgetItems = this.budgetItems.map(i => i.id === item.id ? { ...i, ...item } as BudgetItem : i);
        } else {
            this.budgetItems.push({ ...item, id: uuidv4() } as BudgetItem);
        }
    }

    async deleteBudgetItem(id: string): Promise<void> {
        this.budgetItems = this.budgetItems.filter(i => i.id !== id);
    }

    // --- JARS ---
    async getJars(businessId?: string): Promise<Jar[]> {
        return this.jars;
    }

    async saveJar(jar: Partial<Jar>, businessId?: string): Promise<void> {
        if (jar.id) {
            this.jars = this.jars.map(j => j.id === jar.id ? { ...j, ...jar } as Jar : j);
        } else {
            this.jars.push({ ...jar, id: uuidv4() } as Jar);
        }
    }

    async deleteJar(id: string): Promise<void> {
        this.jars = this.jars.filter(j => j.id !== id);
    }

    // --- RULES ---
    async getRules(businessId?: string): Promise<TextCategoryRule[]> {
        return this.rules;
    }

    async saveRule(rule: Partial<TextCategoryRule>, businessId?: string): Promise<void> {
        if (rule.id) {
            this.rules = this.rules.map(r => r.id === rule.id ? { ...r, ...rule } as TextCategoryRule : r);
        } else {
            this.rules.push({ ...rule, id: uuidv4() } as TextCategoryRule);
        }
    }

    async deleteRule(id: string): Promise<void> {
        this.rules = this.rules.filter(r => r.id !== id);
    }
}
