"use server";

import { encodedRedirect } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES, ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/constants";
import { formatErrorForLogging } from "@/lib/errors";
import { validateFormData, sanitizeEmail } from "@/lib/validation";
import {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation-schemas";

export const signUpAction = async (formData: FormData) => {
  try {
    const validated = validateFormData(signUpSchema, formData);
    const email = sanitizeEmail(validated.email);
    const password = validated.password;
    
    const supabase = await createClient();
    const origin = (await headers()).get("origin");

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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.VALIDATION.EMAIL_AND_PASSWORD_REQUIRED;
    return encodedRedirect("error", ROUTES.SIGN_UP, errorMessage);
  }
};

export const signInAction = async (formData: FormData) => {
  try {
    const validated = validateFormData(signInSchema, formData);
    const email = sanitizeEmail(validated.email);
    const password = validated.password;
    
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return encodedRedirect("error", ROUTES.SIGN_IN, error.message);
    }

    return redirect(ROUTES.PROTECTED_ANALYSIS_HISTORY);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.VALIDATION.EMAIL_AND_PASSWORD_REQUIRED;
    return encodedRedirect("error", ROUTES.SIGN_IN, errorMessage);
  }
};

export const forgotPasswordAction = async (formData: FormData) => {
  try {
    const validated = validateFormData(forgotPasswordSchema, formData);
    const email = sanitizeEmail(validated.email);
    
    const supabase = await createClient();
    const origin = (await headers()).get("origin");
    const callbackUrl = formData.get("callbackUrl")?.toString();

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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.VALIDATION.EMAIL_REQUIRED;
    return encodedRedirect("error", ROUTES.FORGOT_PASSWORD, errorMessage);
  }
};

export const resetPasswordAction = async (formData: FormData) => {
  try {
    const validated = validateFormData(resetPasswordSchema, formData);
    const password = validated.password;
    
    const supabase = await createClient();

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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.VALIDATION.PASSWORD_AND_CONFIRM_REQUIRED;
    return encodedRedirect("error", ROUTES.RESET_PASSWORD, errorMessage);
  }
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect(ROUTES.SIGN_IN);
};
