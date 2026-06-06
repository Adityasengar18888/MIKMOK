"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usersApi } from "@/lib/api";
import { useUserStore } from "@/stores/userStore";
import { useApiToken } from "@/hooks/useAuthSync";
import { Camera, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditProfilePage() {
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const router = useRouter();
  const getToken = useApiToken();

  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/sign-in");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await getToken();
      const { data } = await usersApi.updateProfile({ name, username, bio });
      updateUser(data.user);
      router.push(`/profile/${data.user.username}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-8 px-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/profile/${user.username}`}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold">Edit Profile</h1>
      </div>

      {/* Avatar */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className="w-24 h-24 rounded-full border-4 border-border object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#40E0D0] to-[#00CED1] flex items-center justify-center text-black text-3xl font-black">
              {user.username[0]?.toUpperCase()}
            </div>
          )}
          <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#40E0D0] text-black flex items-center justify-center shadow-lg">
            <Camera className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-2">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#40E0D0]/30"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#40E0D0]/30"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="Tell the world about yourself..."
            className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#40E0D0]/30 resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {bio.length}/200
          </p>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 bg-gradient-to-r from-[#40E0D0] to-[#00CED1] text-black rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}
