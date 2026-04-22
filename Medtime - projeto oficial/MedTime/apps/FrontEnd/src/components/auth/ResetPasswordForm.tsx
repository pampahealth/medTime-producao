"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api-client";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetPasswordSchema = z
  .object({
    passcode: z
      .string()
      .min(6, "Please enter a 6-digit verification code")
      .max(6, "The verification code should be a six-digit number"),
    password: z
      .string()
      .min(6, "The password must be at least six characters long"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

export function ResetPasswordForm({
  onBack,
  onSuccess,
}: ResetPasswordFormProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const sendVerificationCode = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: response } = await api.post("/auth/send-verification", {
        email: email,
        type: "reset-password",
      });

      if (response) {
        return true;
      } else {
        setError(
          response.errorMessage ||
            "Failed to send verification code. Please try again later"
        );
        return false;
      }
    } catch (err: any) {
      setError(
        err.errorMessage ||
          "Failed to send verification code. Please try again later"
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (data: EmailFormData) => {
    const success = await sendVerificationCode(data.email);
    if (success) {
      setUserEmail(data.email);
      setCurrentStep(2);
      setResendCooldown(60);

      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleResetSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: response } = await api.post("/auth/reset-password", {
        email: userEmail,
        passcode: data.passcode,
        password: data.password,
      });

      if (response) {
        onSuccess?.();
      } else {
        setError(
          response.errorMessage ||
            "Password reset failed. Please try again later"
        );
      }
    } catch (err: any) {
      setError(
        err.errorMessage || "Password reset failed. Please try again later"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    const success = await sendVerificationCode(userEmail);
    if (success) {
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const goBackToEmail = () => {
    setCurrentStep(1);
    setError(null);
    resetForm.reset();
  };

  return (
    <div className="sm:rounded-lg sm:border sm:bg-card sm:text-card-foreground sm:shadow-sm w-full max-w-md mx-auto">
      <div className="flex flex-col items-center justify-center gap-[10px] py-[20px]">
        <div className="flex items-center gap-2">
          {currentStep === 2 && (
            <button
              type="button"
              onClick={goBackToEmail}
              className="p-[5px] hover:bg-gray-100 rounded cursor-pointer"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="text-center text-2xl font-semibold">
            {currentStep === 1 ? "Reset Password" : "Set New Password"}
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground">
          Reset your password and secure your account
        </div>
      </div>
      <div className="p-6 pt-0">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentStep === 1 && (
          <form
            onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <div className="mb-[4px] h-[22px] text-sm font-medium">Email</div>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                {...emailForm.register("email")}
                disabled={isLoading}
              />
              {emailForm.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full my-[10px]"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Verification Code
            </Button>

            {onBack && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={onBack}
                  className="text-sm text-muted-foreground hover:underline cursor-pointer"
                  disabled={isLoading}
                >
                  Return to Login
                </button>
              </div>
            )}
          </form>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground mb-6">
              We sent a verification code to{" "}
              <span className="font-medium">{userEmail}</span>
            </div>

            <form
              onSubmit={resetForm.handleSubmit(handleResetSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    disabled={isLoading}
                    value={resetForm.watch("passcode") || ""}
                    onChange={(value) => resetForm.setValue("passcode", value)}
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot
                        index={0}
                        className="rounded-md border border-input"
                      />
                      <InputOTPSlot
                        index={1}
                        className="rounded-md border border-input"
                      />
                      <InputOTPSlot
                        index={2}
                        className="rounded-md border border-input"
                      />
                      <InputOTPSlot
                        index={3}
                        className="rounded-md border border-input"
                      />
                      <InputOTPSlot
                        index={4}
                        className="rounded-md border border-input"
                      />
                      <InputOTPSlot
                        index={5}
                        className="rounded-md border border-input"
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Enter the verification code sent to your email
                </div>
                {resetForm.formState.errors.passcode && (
                  <p className="text-sm text-red-500 text-center">
                    {resetForm.formState.errors.passcode.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="mb-[4px] h-[22px] text-sm font-medium">
                  New Password
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  {...resetForm.register("password")}
                  disabled={isLoading}
                />
                {resetForm.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {resetForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="mb-[4px] h-[22px] text-sm font-medium">
                  Confirm Password
                </div>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  {...resetForm.register("confirmPassword")}
                  disabled={isLoading}
                />
                {resetForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {resetForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full my-[10px]"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  Didn't receive the code?{" "}
                </span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="cursor-pointer hover:underline"
                  disabled={isLoading || resendCooldown > 0}
                >
                  {resendCooldown > 0
                    ? `Resend code (${resendCooldown}s)`
                    : "Resend code"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
