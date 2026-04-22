"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "./AuthProvider";
import { Loader2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api-client";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "The password must be at least six characters long"),
});

const verificationSchema = z.object({
  passcode: z
    .string()
    .min(6, "Please enter a 6-digit verification code")
    .max(6, "The verification code should be a six-digit number"),
});

type CredentialsFormData = z.infer<typeof credentialsSchema>;
type VerificationFormData = z.infer<typeof verificationSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({
  onSuccess,
  onSwitchToLogin,
}: RegisterFormProps) {
  const { register: registerUser } = useAuth();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userPassword, setUserPassword] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const firstOtpRef = useRef<HTMLInputElement>(null);

  const credentialsForm = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsSchema),
  });

  const verificationForm = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
  });

  const sendVerificationCode = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: response } = await api.post("/auth/send-verification", {
        email,
        type: "register",
      });

      if (!response) {
        setError(
          response.errorMessage || "Failed to send the verification code"
        );
        return false;
      }

      return true;
    } catch (err: any) {
      setError(
        err.errorMessage ||
          "Failed to send the verification code. Please try again later"
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialsSubmit = async (data: CredentialsFormData) => {
    const success = await sendVerificationCode(data.email);
    if (success) {
      setUserEmail(data.email);
      setUserPassword(data.password);
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

  useEffect(() => {
    if (currentStep === 2 && firstOtpRef.current) {
      setTimeout(() => {
        firstOtpRef.current?.focus();
      }, 100);
    }
  }, [currentStep]);

  const handleVerificationSubmit = async (data: VerificationFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      await registerUser(
        userEmail,
        userPassword,
        data.passcode
      );
      onSuccess?.();
    } catch (err: any) {
      setError(
        err.errorMessage || "Registration failed. Please try again later"
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

  const goBackToCredentials = () => {
    setCurrentStep(1);
    setError(null);
    verificationForm.reset();
  };

  return (
    <div className="sm:rounded-lg sm:border sm:bg-card sm:text-card-foreground sm:shadow-sm w-full max-w-md mx-auto">
      <div className="flex flex-col items-center justify-center gap-[10px] py-[20px]">
        <div className="flex items-center gap-2">
          {currentStep === 2 && (
            <button
              type="button"
              onClick={goBackToCredentials}
              className="p-[5px] hover:bg-gray-100 rounded cursor-pointer"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="text-center text-2xl font-semibold">
            {currentStep === 1 ? "Create your account" : "Verification Code"}
          </div>
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
            onSubmit={credentialsForm.handleSubmit(handleCredentialsSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <div className="mb-[4px] h-[22px] text-sm font-medium">Email</div>
              <Input
                id="email"
                type="email"
                placeholder="email"
                {...credentialsForm.register("email")}
                disabled={isLoading}
              />
              {credentialsForm.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {credentialsForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="mb-[4px] h-[22px] text-sm font-medium">
                Password
              </div>
              <Input
                id="password"
                type="password"
                placeholder="password"
                {...credentialsForm.register("password")}
                disabled={isLoading}
              />
              {credentialsForm.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {credentialsForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full my-[10px]"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>

            {onSwitchToLogin && (
              <div className="text-center text-sm flex items-center justify-center gap-2">
                <span className="text-center text-muted-foreground">
                  Already have an account?
                </span>
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="cursor-pointer hover:underline"
                  disabled={isLoading}
                >
                  Login now
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
              onSubmit={verificationForm.handleSubmit(handleVerificationSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    disabled={isLoading}
                    value={verificationForm.watch("passcode") || ""}
                    onChange={(value) =>
                      verificationForm.setValue("passcode", value)
                    }
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot
                        ref={firstOtpRef}
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
                {verificationForm.formState.errors.passcode && (
                  <p className="text-sm text-red-500 text-center">
                    {verificationForm.formState.errors.passcode.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full my-[10px]"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Email
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
                    ? `Resend email (${resendCooldown}s)`
                    : "Resend email"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
