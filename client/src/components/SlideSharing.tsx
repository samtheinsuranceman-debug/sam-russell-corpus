import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Share2, Copy, Link2, Trash2, Loader2, Mail, Eye, MessageSquare, Pencil,
} from "lucide-react";

interface SlideSharingProps {
  deckId: number;
  deckTitle: string;
}

const PERMISSION_ICONS: Record<string, any> = {
  view: Eye,
  comment: MessageSquare,
  edit: Pencil,
};

const PERMISSION_LABELS: Record<string, string> = {
  view: "View Only",
  comment: "Can Comment",
  edit: "Can Edit",
};

export default function SlideSharing({ deckId, deckTitle }: SlideSharingProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "comment" | "edit">("comment");
  const [open, setOpen] = useState(false);

  const { data: shares, refetch } = trpc.slides.getShares.useQuery({ deckId }, { enabled: open });

  const shareMut = trpc.slides.share.useMutation({
    onSuccess: () => {
      setEmail("");
      refetch();
      toast.success("Share link sent");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMut = trpc.slides.removeShare.useMutation({
    onSuccess: () => { refetch(); toast.success("Access removed"); },
  });

  const handleShare = () => {
    if (!email.trim()) return;
    shareMut.mutate({ deckId, email: email.trim(), permission });
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/shared-slides/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-zinc-300 border-zinc-600">
          <Share2 className="h-3 w-3 mr-1" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Share "{deckTitle}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invite by email */}
          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">Invite by email</Label>
            <div className="flex gap-2">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="bg-zinc-800/50 border-zinc-700/50 flex-1"
                type="email"
              />
              <Select value={permission} onValueChange={(v) => setPermission(v as any)}>
                <SelectTrigger className="w-[130px] bg-zinc-800/50 border-zinc-700/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only</SelectItem>
                  <SelectItem value="comment">Can Comment</SelectItem>
                  <SelectItem value="edit">Can Edit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleShare}
              disabled={shareMut.isPending || !email.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              size="sm"
            >
              {shareMut.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Mail className="h-3 w-3 mr-1" />
              )}
              Send Invite
            </Button>
          </div>

          {/* Existing shares */}
          {shares && shares.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">People with access</Label>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {shares.map((share: any) => {
                  const PermIcon = PERMISSION_ICONS[share.permission] || Eye;
                  return (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-2 rounded-lg border border-zinc-700/50 bg-zinc-800/20"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                          <Mail className="h-3 w-3 text-zinc-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-zinc-300 truncate">{share.sharedWithEmail}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-500 shrink-0">
                          <PermIcon className="h-2.5 w-2.5 mr-0.5" />
                          {PERMISSION_LABELS[share.permission]}
                        </Badge>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          className="p-1 text-zinc-500 hover:text-zinc-300"
                          onClick={() => copyLink(share.shareToken)}
                          title="Copy link"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          className="p-1 text-zinc-500 hover:text-red-400"
                          onClick={() => removeMut.mutate({ id: share.id })}
                          title="Remove access"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick copy link */}
          <div className="pt-2 border-t border-zinc-700/50">
            <p className="text-[10px] text-zinc-600 text-center">
              <Link2 className="h-3 w-3 inline mr-1" />
              Share links give access based on the permission level you set
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
