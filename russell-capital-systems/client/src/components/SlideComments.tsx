import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  MessageSquare, Send, CheckCircle, Trash2, Reply, Loader2, User,
} from "lucide-react";

interface SlideCommentsProps {
  deckId: number;
  activeSlideIndex?: number;
}

export default function SlideComments({ deckId, activeSlideIndex }: SlideCommentsProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: comments, refetch } = trpc.slides.getComments.useQuery({ deckId });

  const addMut = trpc.slides.addComment.useMutation({
    onSuccess: () => {
      setNewComment("");
      setReplyTo(null);
      setReplyText("");
      refetch();
      toast.success("Comment added");
    },
    onError: (err) => toast.error(err.message),
  });

  const resolveMut = trpc.slides.resolveComment.useMutation({
    onSuccess: () => { refetch(); toast.success("Resolved"); },
  });

  const deleteMut = trpc.slides.deleteComment.useMutation({
    onSuccess: () => { refetch(); toast.success("Deleted"); },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    addMut.mutate({
      deckId,
      slideIndex: activeSlideIndex,
      content: newComment.trim(),
    });
  };

  const handleReply = (parentId: number) => {
    if (!replyText.trim()) return;
    addMut.mutate({
      deckId,
      slideIndex: activeSlideIndex,
      content: replyText.trim(),
      parentId,
    });
  };

  // Filter comments for current slide or show all
  const filteredComments = comments?.filter(
    (c: any) => activeSlideIndex === undefined || c.slideIndex === null || c.slideIndex === activeSlideIndex
  ) || [];

  const topLevel = filteredComments.filter((c: any) => !c.parentId);
  const replies = (parentId: number) => filteredComments.filter((c: any) => c.parentId === parentId);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="h-4 w-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">
          Comments {activeSlideIndex !== undefined && `(Slide ${activeSlideIndex + 1})`}
        </h3>
        <Badge variant="outline" className="text-[10px] text-zinc-500 border-zinc-700">
          {filteredComments.length}
        </Badge>
      </div>

      {/* New comment */}
      <div className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="bg-zinc-800/50 border-zinc-700/50 text-sm h-16 resize-none flex-1"
        />
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 self-end"
          onClick={handleSubmit}
          disabled={addMut.isPending || !newComment.trim()}
        >
          {addMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
        </Button>
      </div>

      {/* Comments list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {topLevel.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center py-4">No comments yet. Be the first to add one.</p>
        ) : (
          topLevel.map((comment: any) => (
            <div key={comment.id} className="space-y-1">
              <div className={`p-3 rounded-lg border ${comment.resolved ? "border-emerald-500/20 bg-emerald-500/5" : "border-zinc-700/50 bg-zinc-800/30"}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center">
                      <User className="h-3 w-3 text-zinc-400" />
                    </div>
                    <span className="text-xs font-medium text-zinc-300">{comment.userName}</span>
                    {comment.slideIndex !== null && (
                      <Badge variant="outline" className="text-[9px] text-zinc-500 border-zinc-700">
                        Slide {comment.slideIndex + 1}
                      </Badge>
                    )}
                    {comment.resolved && (
                      <Badge className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        Resolved
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-600">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{comment.content}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  >
                    <Reply className="h-3 w-3" /> Reply
                  </button>
                  {!comment.resolved && (
                    <button
                      className="text-[10px] text-zinc-500 hover:text-emerald-400 flex items-center gap-1"
                      onClick={() => resolveMut.mutate({ id: comment.id })}
                    >
                      <CheckCircle className="h-3 w-3" /> Resolve
                    </button>
                  )}
                  {user?.id === comment.userId && (
                    <button
                      className="text-[10px] text-zinc-500 hover:text-red-400 flex items-center gap-1"
                      onClick={() => deleteMut.mutate({ id: comment.id })}
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Replies */}
              {replies(comment.id).map((reply: any) => (
                <div key={reply.id} className="ml-6 p-2.5 rounded-lg border border-zinc-700/30 bg-zinc-800/20">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded-full bg-zinc-700 flex items-center justify-center">
                      <User className="h-2.5 w-2.5 text-zinc-400" />
                    </div>
                    <span className="text-[11px] font-medium text-zinc-400">{reply.userName}</span>
                    <span className="text-[10px] text-zinc-600">{new Date(reply.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-zinc-400">{reply.content}</p>
                </div>
              ))}

              {/* Reply input */}
              {replyTo === comment.id && (
                <div className="ml-6 flex gap-2">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="bg-zinc-800/50 border-zinc-700/50 text-xs h-12 resize-none flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="self-end text-xs border-zinc-600"
                    onClick={() => handleReply(comment.id)}
                    disabled={addMut.isPending || !replyText.trim()}
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
