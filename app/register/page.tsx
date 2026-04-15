"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, User, Phone, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { findUserByEmail, saveUser, setCurrentUser, getCurrentUser, type User as UserType } from "@/lib/auth-store";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = getCurrentUser();
    if (user) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError("Please enter your name");
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("Please enter a valid email");
      return false;
    }
    if (findUserByEmail(formData.email)) {
      setError("An account with this email already exists");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setError("Please enter a valid phone number");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));

    const newUser: UserType = {
      id: crypto.randomUUID(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      emergencyContacts: [],
      createdAt: Date.now(),
    };

    saveUser(newUser);
    setCurrentUser(newUser);
    router.push("/dashboard");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-safe/5">
      {/* Background logo watermark */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none bg-center bg-no-repeat z-0"
        style={{ 
          backgroundImage: "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-6s0cBIRUDvjt5XihKQ1vZiJttja4yD.png')", 
          backgroundSize: "45%" 
        }}
      />
      
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-safe/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-warning/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white shadow-2xl shadow-primary/30 mb-6 p-2 overflow-hidden">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-6s0cBIRUDvjt5XihKQ1vZiJttja4yD.png" 
                alt="Women Safety App" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
            <p className="text-muted-foreground">Join Women Safety App for your protection</p>
          </div>

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    s < step
                      ? "bg-safe text-white"
                      : s === step
                      ? "bg-primary text-primary-foreground scale-110"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-12 h-1 rounded ${s < step ? "bg-safe" : "bg-muted"} transition-colors`} />
                )}
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 p-8 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-5 animate-fade-in">
                  <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className="pl-12 h-12 rounded-xl border-2 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="pl-12 h-12 rounded-xl border-2 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Phone */}
              {step === 2 && (
                <div className="space-y-5 animate-fade-in">
                  <h2 className="text-lg font-semibold text-foreground">Contact Details</h2>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        className="pl-12 h-12 rounded-xl border-2 focus:border-primary font-mono"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will be used for emergency alerts
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Password */}
              {step === 3 && (
                <div className="space-y-5 animate-fade-in">
                  <h2 className="text-lg font-semibold text-foreground">Secure Your Account</h2>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        className="pl-12 pr-12 h-12 rounded-xl border-2 focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange("confirmPassword", e.target.value)}
                        className="pl-12 h-12 rounded-xl border-2 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-shake">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="flex-1 h-12 rounded-xl"
                  >
                    Back
                  </Button>
                )}
                
                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                  >
                    <div className="flex items-center gap-2">
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-safe to-safe/80 hover:from-safe/90 hover:to-safe/70 shadow-lg shadow-safe/25"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Create Account
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Features preview */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Free Forever</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-safe" />
              <span>No Ads</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-warning" />
              <span>Private</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
