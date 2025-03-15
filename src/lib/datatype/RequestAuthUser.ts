export type UserLoginRequest = {
    email: string;
    password: string;
};

export type UserRegisterRequest = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string; // ✅ Added for validation
    role?: string; // ✅ Made optional to avoid errors if not provided
};
