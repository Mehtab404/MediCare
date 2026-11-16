import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, User, Lock, ArrowRight, IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const USER_ID_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/;

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();

  const fail = (description: string) => toast({ title: "Can't register", description, variant: "destructive" });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (fullName.trim().length < 2) return fail("Please enter your full name.");
    if (!USER_ID_PATTERN.test(userId.trim())) {
      return fail("User ID must be 3-32 characters: letters, numbers, dot, dash or underscore.");
    }
    if (password.length < 8) return fail("Password must be at least 8 characters.");
    if (password !== confirmPassword) return fail("Passwords don't match.");

    setIsLoading(true);
    try {
      // On success the route guard sends the new patient to the dashboard.
      await register(userId.trim(), fullName.trim(), password);
    } catch (err) {
      fail(err instanceof Error ? err.message : "Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="p-3 gradient-medical rounded-xl">
            <Activity className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">MediCare</h1>
            <p className="text-sm text-muted-foreground">Hospital Management</p>
          </div>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <h2 className="text-2xl font-bold text-foreground">Create Patient Account</h2>
            <p className="text-muted-foreground">Register to book and manage appointments</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Full Name"
                  aria-label="Full Name"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-11 h-12"
                />
              </div>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="User ID"
                  aria-label="User ID"
                  autoComplete="username"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="pl-11 h-12"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password (min 8 characters)"
                  aria-label="Password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-12"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  aria-label="Confirm Password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-11 h-12"
                />
              </div>

              <Button type="submit" className="w-full h-12 text-lg font-medium" disabled={isLoading}>
                {isLoading ? (
                  <span className="animate-pulse-soft">Creating account...</span>
                ) : (
                  <>
                    Register
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/" className="text-primary hover:underline font-medium">
                  Log in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
