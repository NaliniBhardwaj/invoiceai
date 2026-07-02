import { apiClient } from "@/lib/api-client";
import type { AuthResponse } from "@/features/auth/types/auth.types";
import type { LoginFormValues, RegisterFormValues } from "@/features/auth/validation/auth.schema";

export const authApi = {
  login: async (values: LoginFormValues): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/login", values);
    return data;
  },
  register: async (values: RegisterFormValues): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/register", values);
    return data;
  },
};
