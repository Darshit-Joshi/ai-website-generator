"use client";

import React, { useContext, useState, useCallback } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { SignInButton, useAuth, useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  ArrowUp,
  ImagePlus,
  LayoutDashboard,
  Key,
  HomeIcon,
  User,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserDetailContext } from "@/context/UserDetailContext";

// Explicit static suggestion definitions
const suggestions = [
  {
    label: "Dashboard",
    prompt: "Create an analytics dashboard to track customers and review",
    icon: LayoutDashboard,
  },
  {
    label: "SignUp Form",
    prompt:
      "Create a modern sign up form with email/password fields, and other necessary details",
    icon: Key,
  },
  {
    label: "Hero",
    prompt:
      "Create a modern header and centered hero section for a prompt generating website",
    icon: HomeIcon,
  },
  {
    label: "User Profile Card",
    prompt: "Create a modern user profile card component for a social media",
    icon: User,
  },
];

function Hero() {
  const [userInput, setUserInput] = useState("");
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const userContext = useContext(UserDetailContext);
  const userDetail = userContext?.userDetail;
  const setUserDetail = userContext?.setUserDetail;

  const { has } = useAuth();
  const hasUnlimitedAccess = !!(has && has({ plan: "unlimited" }));

  // Safe string-casted numeric index allocation handle
  const generateRandomFrameId = useCallback(() => {
    return String(Math.floor(Math.random() * 100000));
  }, []);

  // ==========================================
  // CORE PROJECT CREATION ACTION CONTROLLER
  // ==========================================
  const CreateNewProject = async () => {
    // 1. Guard check defensive fallback constraints against uninitialized content stores
    const availableCredits = userDetail?.credits ?? 0;

    if (!hasUnlimitedAccess && availableCredits <= 0) {
      toast.error(
        "Your credit balance is exhausted. Please upgrade to continue.",
      );
      return;
    }

    try {
      setLoading(true);

      const projectId = uuidv4();
      const frameId = generateRandomFrameId();

      // Establish unified prompt structures mapping user contexts cleanly
      const initialChatHistory = [
        {
          role: "user",
          content: userInput.trim(),
        },
      ];

      // Dispatch payload cleanly to server route handlers
      await axios.post("/api/projects", {
        projectId,
        frameId,
        messages: initialChatHistory,
        // Send the credit snapshot safely—let the backend process database mutations cleanly
        credits: availableCredits,
      });

      toast.success("Project workspace initialized!");

      // Update local context cache smoothly following successful network resolution
      if (!hasUnlimitedAccess && setUserDetail) {
        setUserDetail((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            credits: Math.max(0, (prev.credits ?? 0) - 1),
          };
        });
      }

      // Smooth redirection layout trigger
      router.push(`/playground/${projectId}?frameId=${frameId}`);
    } catch (e: any) {
      console.error("Project generation failure:", e);
      toast.error(
        e.response?.data?.error ||
          "Failed to initialize website generation pipeline.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center h-[80vh] justify-center select-none bg-background px-4">
      {/* BRANDING HEADER SPACE BLOCK */}
      <div className="text-center max-w-2xl space-y-2 mb-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <h1 className="font-extrabold text-4xl sm:text-5xl tracking-tight text-foreground">
          What should we design?
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg font-medium">
          Generate, edit, and explore production-ready single-file websites with
          AI.
        </p>
      </div>

      {/* COMPREHENSIVE INPUT UTILITY AREA */}
      <div className="w-full max-w-xl border rounded-2xl p-4 bg-white shadow-md focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <textarea
          className="w-full h-24 focus:outline-none focus:ring-0 resize-none text-sm font-medium leading-relaxed bg-transparent text-foreground placeholder:text-muted-foreground/70"
          placeholder="Describe your layout design vision in detail (e.g., A minimalist SaaS landing page with dark theme)..."
          value={userInput}
          disabled={loading}
          onChange={(event) => setUserInput(event.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              userInput.trim() &&
              !loading &&
              user
            ) {
              e.preventDefault();
              CreateNewProject();
            }
          }}
        />
        <div className="flex justify-between items-center border-t pt-3 mt-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-9 w-9 rounded-xl"
            disabled={loading}
            onClick={() =>
              toast.info(
                "Asset attachment options are accessible inside the playground workspace view.",
              )
            }
          >
            <ImagePlus className="h-4 w-4" />
          </Button>

          {!user ? (
            <SignInButton mode="modal" forceRedirectUrl="/workspace">
              <Button
                disabled={!userInput.trim()}
                size="icon"
                className="h-9 w-9 rounded-xl shadow-sm"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </SignInButton>
          ) : (
            <Button
              disabled={!userInput.trim() || loading}
              onClick={CreateNewProject}
              size="icon"
              className="h-9 w-9 rounded-xl shadow-sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* DISCOVER SUGGESTION CHIPS CONTROLLER */}
      <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-2xl">
        {suggestions.map((menu, index) => {
          const IconComponent = menu.icon;
          return (
            <Button
              key={menu.label || index}
              variant="outline"
              size="sm"
              className="text-xs font-semibold h-9 rounded-xl gap-2 hover:bg-secondary/60 transition-colors"
              disabled={loading}
              onClick={() => setUserInput(menu.prompt)}
            >
              <IconComponent className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{menu.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export default Hero;
