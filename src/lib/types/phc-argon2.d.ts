declare module '@phc/argon2' {
    interface Argon2Options {
        memoryCost?: number;
        timeCost?: number;
        parallelism?: number;
        variant?: 'i' | 'd' | 'id';
    }

    interface Argon2 {
        hash(password: string, options?: Argon2Options): Promise<string>;
        verify(hash: string, password: string): Promise<boolean>;
    }

    const argon2: Argon2;
    export default argon2;
} 