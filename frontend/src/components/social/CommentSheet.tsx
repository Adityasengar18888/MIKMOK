"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentsApi } from "@/lib/api";
import { useApiToken } from "@/hooks/useAuthSync";
import { formatCount, formatTimeAgo, cn } from "@/lib/utils";
import type { Comment } from "@/types";

interface CommentSheetProps {
  videoId: string;
  commentCount: number;
}

export default function CommentSheet({ videoId, commentCount }: CommentSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const getToken = useApiToken();
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["comments", videoId],
    queryFn: async () => {
      const res = await commentsApi.getVideoComments(videoId);
      return res.data;
    },
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      await getToken();
      return commentsApi.create({
        videoId,
        content,
        parentId: replyTo?.id,
      });
    },
    onSuccess: () => {
      setNewComment("");
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await getToken();
      return commentsApi.delete(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newComment.trim()) return;

      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }

      createMutation.mutate(newComment.trim());
    },
    [newComment, isSignedIn, router, createMutation]
  );

  const comments: Comment[] = data?.comments || [];

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex flex-col items-center gap-1 group"
      >
        <div className="w-12 h-12 rounded-full glass-dark flex items-center justify-center transition-all group-hover:bg-white/10">
          <MessageCircle className="w-6 h-6 text-white drop-shadow-md" />
        </div>
        <span className="text-white text-xs font-bold drop-shadow-md">
          {formatCount(commentCount)}
        </span>
      </button>

      {/* Comment Sheet Overlay */}
      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end" onClick={() => setIsOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Sheet/Sidebar (Right side on desktop, bottom on mobile) */}
          <div
            className="relative w-full sm:w-[400px] h-[70vh] sm:h-full mt-auto sm:mt-0 bg-background sm:rounded-l-3xl rounded-t-3xl sm:rounded-tr-none border-l border-t sm:border-t-0 border-border animate-slide-up sm:animate-fade-in flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle for mobile */}
            <div className="flex sm:hidden items-center justify-center pt-3 pb-2 shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h3 className="font-bold text-lg text-foreground">
                Comments ({formatCount(commentCount)})
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 no-scrollbar">
              {isLoading ? (
                <div className="space-y-5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-10 h-10 rounded-full skeleton shrink-0" />
                      <div className="flex-1 space-y-2">
                         <div className="w-32 h-3 skeleton rounded" />
                         <div className="w-full h-4 skeleton rounded" />
                         <div className="w-2/3 h-4 skeleton rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center pb-12">
                  <MessageCircle className="w-14 h-14 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-foreground mb-1">No comments yet</p>
                  <p className="text-sm text-muted-foreground">Be the first to share your thoughts!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 animate-fade-in">
                    {comment.user.avatar ? (
                      <img
                        src={comment.user.avatar}
                        alt={comment.user.username}
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#14b8a6] flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {comment.user.username[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-sm font-bold text-foreground">
                          @{comment.user.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-[15px] text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <button
                          onClick={() =>
                            setReplyTo({ id: comment.id, username: comment.user.username })
                          }
                          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Reply
                        </button>
                        {comment._count && comment._count.replies > 0 && (
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <ChevronDown className="w-3 h-3" />
                            {comment._count.replies} replies
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="px-6 py-4 border-t border-border bg-background shrink-0"
            >
              {replyTo && (
                <div className="flex items-center gap-2 mb-3 px-2 py-1.5 bg-muted/50 rounded-lg text-xs font-medium text-muted-foreground w-fit">
                  <span>Replying to @{replyTo.username}</span>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="text-[#06b6d4] hover:text-[#14b8a6] ml-1 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex items-end gap-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={isSignedIn ? "Add a comment..." : "Sign in to comment"}
                  className="flex-1 bg-muted/50 border border-border/80 rounded-2xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/40 focus:border-[#06b6d4]/40 resize-none min-h-[48px] max-h-[120px]"
                  disabled={!isSignedIn}
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || createMutation.isPending}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 shadow-sm",
                    newComment.trim()
                      ? "bg-gradient-to-r from-[#06b6d4] to-[#14b8a6] text-white hover:opacity-90 hover:shadow-md hover:scale-105"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  <Send className="w-5 h-5 -ml-0.5" />
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
