"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/features/auth/services/auth.service";
import { useAuth } from "@/lib/auth-context";

export function useRegister() {
  const router = useRouter();
  const { setSession } = useAuth();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setSession(data.token, data.user);
      router.push("/dashboard");
    },
  });
}
