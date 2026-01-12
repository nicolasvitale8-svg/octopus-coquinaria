import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock para Supabase
vi.mock('../services/supabase', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
            getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
                })),
                order: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
            insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
            update: vi.fn(() => Promise.resolve({ data: [], error: null })),
            delete: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
    },
}));

// Mock para localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Silenciar console.log en tests
vi.spyOn(console, 'log').mockImplementation(() => { });
vi.spyOn(console, 'warn').mockImplementation(() => { });
