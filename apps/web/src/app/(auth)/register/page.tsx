import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="register-email">Email</Label>
              <Input id="register-email" placeholder="you@company.com" type="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="register-password">Password</Label>
              <Input id="register-password" placeholder="Create a password" type="password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="organization-name">Organization name</Label>
              <Input id="organization-name" placeholder="Acme Inc." />
            </div>
            <Button type="submit">Create account</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
