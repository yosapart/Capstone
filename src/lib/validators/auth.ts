// src/lib/validators/auth.ts
import { z } from "zod";

export const registerSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(50),

    email: z.string()
        .email("Invalid email format"),

    password: z.string()
        .min(6, "Password must be at least 6 characters")
        .max(100),

    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});