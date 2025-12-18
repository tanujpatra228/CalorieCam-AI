"use server";

import { encodedRedirect } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES, ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/constants";
import { formatErrorForLogging } from "@/lib/errors";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      ROUTES.SIGN_UP,
      ERROR_MESSAGES.VALIDATION.EMAIL_AND_PASSWORD_REQUIRED,
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    const errorMessage = formatErrorForLogging(error)
    console.error(errorMessage)
    return encodedRedirect("error", ROUTES.SIGN_UP, error.message);
  } else {
    return encodedRedirect(
      "success",
      ROUTES.SIGN_UP,
      SUCCESS_MESSAGES.AUTH.SIGN_UP_SUCCESS,
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", ROUTES.SIGN_IN, error.message);
  }

  return redirect(ROUTES.PROTECTED_ANALYSIS_HISTORY);
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", ROUTES.FORGOT_PASSWORD, ERROR_MESSAGES.VALIDATION.EMAIL_REQUIRED);
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    const errorMessage = formatErrorForLogging(error)
    console.error(errorMessage)
    return encodedRedirect(
      "error",
      ROUTES.FORGOT_PASSWORD,
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    ROUTES.FORGOT_PASSWORD,
    SUCCESS_MESSAGES.AUTH.PASSWORD_RESET_SENT,
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      ROUTES.RESET_PASSWORD,
      ERROR_MESSAGES.VALIDATION.PASSWORD_AND_CONFIRM_REQUIRED,
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      ROUTES.RESET_PASSWORD,
      ERROR_MESSAGES.VALIDATION.PASSWORDS_DO_NOT_MATCH,
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return encodedRedirect(
      "error",
      ROUTES.RESET_PASSWORD,
      "Password update failed",
    );
  }

  return encodedRedirect("success", ROUTES.RESET_PASSWORD, SUCCESS_MESSAGES.AUTH.PASSWORD_UPDATED);
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect(ROUTES.SIGN_IN);
};
