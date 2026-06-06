"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/clerk-react";
import { Upload, X, Hash, Loader2, Film, CheckCircle } from "lucide-react";
import { videosApi } from "@/lib/api";
import { useApiToken } from "@/hooks/useAuthSync";
import { cn } from "@/lib/utils";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const getToken = useApiToken();

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign in to Upload</h2>
          <p className="text-muted-foreground mb-6">You need an account to upload videos</p>
          <button
            onClick={() => router.push("/sign-in")}
            className="px-6 py-2.5 bg-gradient-to-r from-[#40E0D0] to-[#00CED1] text-black font-bold rounded-xl hover:opacity-90"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);

    // Validate
    const maxSize = 100 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError("File is too large. Maximum size is 100MB.");
      return;
    }

    const allowedTypes = [
      "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
      "image/jpeg", "image/png", "image/webp", "image/jpg"
    ];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Invalid file type. Please upload MP4, WebM, MOV, JPG, PNG, or WEBP.");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().toLowerCase().replace(/^#/, "");
    if (tag && !hashtags.includes(tag) && hashtags.length < 10) {
      setHashtags([...hashtags, tag]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      await getToken();

      const formData = new FormData();
      formData.append("video", file);
      formData.append("caption", caption);
      formData.append("hashtags", JSON.stringify(hashtags));

      // Simulate progress since axios doesn't support it well with our setup
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 5, 90));
      }, 500);

      await videosApi.upload(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsSuccess(true);

      setTimeout(() => {
        router.push("/feed");
      }, 2000);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Upload failed. Please try again.");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4 animate-pulse-glow" style={{ "--tw-shadow-color": "rgba(34, 197, 94, 0.3)" } as any}>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Video Published!</h2>
          <p className="text-muted-foreground">Redirecting to feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold mb-1">Create Post</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Share your creativity with the world
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Upload area / Preview */}
          <div>
            {!file ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[9/16] max-h-[550px] rounded-[2rem] border-2 border-dashed border-border/60 bg-muted/20 hover:border-[#40E0D0] hover:bg-[#40E0D0]/5 transition-all duration-300 flex flex-col items-center justify-center gap-5 group"
              >
                <div className="w-20 h-20 rounded-[1.5rem] bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-8 h-8 text-muted-foreground group-hover:text-[#40E0D0] transition-colors" />
                </div>
                <div className="text-center px-6">
                  <p className="font-bold text-lg mb-1 group-hover:text-[#40E0D0] transition-colors">Select video to upload</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Video or Photo<br />Up to 100MB • Max 5 min
                  </p>
                </div>
                <div className="px-8 py-3 bg-[#40E0D0] text-black rounded-xl font-bold text-sm shadow-lg shadow-[#40E0D0]/20 btn-glow">
                  Choose File
                </div>
              </button>
            ) : (
              <div className="relative w-full aspect-[9/16] max-h-[550px] rounded-[2rem] overflow-hidden bg-black shadow-xl flex items-center justify-center">
                {file?.type.startsWith("image/") ? (
                  <img
                    src={preview!}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={preview!}
                    className="w-full h-full object-cover"
                    controls
                    muted
                  />
                )}
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/60 flex items-center justify-center text-black hover:bg-white/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Caption */}
            <div>
              <label className="block text-sm font-semibold mb-2">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption for your video..."
                maxLength={500}
                rows={4}
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#40E0D0]/30 resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {caption.length}/500
              </p>
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-semibold mb-2">Hashtags</label>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 flex items-center bg-input border border-border rounded-xl px-3">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <input
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())}
                    placeholder="Add hashtag"
                    className="flex-1 bg-transparent py-2.5 px-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
                <button
                  onClick={addHashtag}
                  className="px-4 py-2 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80"
                >
                  Add
                </button>
              </div>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#40E0D0]/10 text-[#40E0D0] rounded-full text-xs font-medium"
                    >
                      #{tag}
                      <button
                        onClick={() => removeHashtag(tag)}
                        className="hover:text-[#40E0D0]/60"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive animate-fade-in">
                {error}
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#40E0D0] to-[#00CED1] rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className={cn(
                "w-full py-3 rounded-xl font-bold text-sm transition-all",
                file && !isUploading
                  ? "bg-gradient-to-r from-[#40E0D0] to-[#00CED1] text-black hover:opacity-90 shadow-lg shadow-[#40E0D0]/20"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </span>
              ) : (
                "Publish Video"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
