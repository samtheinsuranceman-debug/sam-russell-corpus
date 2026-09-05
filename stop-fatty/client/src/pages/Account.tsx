import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Trash2, AlertTriangle } from "lucide-react";

export default function Account() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const cancelSub = trpc.subscription.cancel.useMutation({
    onSuccess: () => {
      toast.success("Subscription cancelled. You'll retain access until the end of your billing period.");
    },
    onError: () => {
      toast.error("Failed to cancel subscription. Please try again.");
    },
  });

  const deleteAccount = trpc.account.delete.useMutation({
    onSuccess: () => {
      toast.success("Account deleted. Redirecting...");
      setTimeout(() => { window.location.href = "/"; }, 1500);
    },
    onError: () => {
      toast.error("Failed to delete account. Please try again.");
    },
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!isAuthenticated) { navigate("/"); return null; }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

        {/* User Info */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Name: <span className="text-foreground font-medium">{user?.name || "—"}</span></p>
            <p className="text-sm text-muted-foreground mt-1">Email: <span className="text-foreground font-medium">{user?.email || "—"}</span></p>
          </CardContent>
        </Card>

        {/* Cancel Subscription */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Cancel your subscription. You'll keep access until the end of your current billing period.
            </p>
            <Button
              variant="outline"
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
              onClick={() => cancelSub.mutate()}
              disabled={cancelSub.isPending}
            >
              {cancelSub.isPending ? "Cancelling..." : "Cancel Subscription"}
            </Button>
          </CardContent>
        </Card>

        {/* Delete Account */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" /> Delete Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showDeleteConfirm ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all data. This cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete My Account
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive font-medium">
                    This will permanently delete all your recordings, calibration data, temptation journal, and subscription. Type "DELETE" to confirm.
                  </p>
                </div>
                <input
                  type="text"
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  placeholder='Type "DELETE" to confirm'
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    disabled={deleteText !== "DELETE" || deleteAccount.isPending}
                    onClick={() => deleteAccount.mutate()}
                  >
                    {deleteAccount.isPending ? "Deleting..." : "Permanently Delete"}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeleteText(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
