"use client";
import {
  ArrowUp,
  ImagePlus,
  LayoutDashboard,
  Key,
  HomeIcon,
  User,
  Loader2Icon,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import React, { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { SignInButton, useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UserDetailContext } from "@/context/UserDetailContext";

const suggestions = [
  {
    label: "Dashboard",
    prompt: "Create an analytics dashboard to track customers and review",
    icon: LayoutDashboard,
  },
  {
    label: "SignUp Form",
    prompt:
      "Create a modern sign up form with email/password fields,and other necessary details",
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
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const { has } = useAuth();
  const hasUnlimitedAccess = has && has({ plan: "unlimited" });

  const generateRandomFrameNumber = () => {
    const num = Math.floor(Math.random() * 1000);
    return num;
  };

  const CreateNewProject = async () => {
    if (!hasUnlimitedAccess && userDetail.credits! <= 0) {
      toast.error("You have no credits left");
      return;
    }

    setLoading(true);

    const projectId = uuidv4();
    const frameId = generateRandomFrameNumber();

    // 🔥 STRONG SYSTEM RULES (IMPORTANT FIX)
    const messages = [
      {
        role: "system",
        content: `
You are a professional website generator.

STRICT RULES:
- Generate complete HTML websites only
- Must include full layout (header, hero, sections, footer)
- Every <img> must have a valid working URL
- Use ONLY:
  https://images.unsplash.com/
  https://source.unsplash.com/
- Never leave empty src
- Never use placeholders like "image.jpg"
- Output must be production-ready UI
`,
      },
      {
        role: "user",
        content: userInput,
      },
    ];

    try {
      const result = await axios.post("/api/projects", {
        projectId,
        frameId,
        messages, // 🔥 FIXED (important)
        credits: userDetail?.credits,
      });

      toast.success("Project Created");

      router.push(`/playground/${projectId}?frameId=${frameId}`);

      setUserDetail((prev: any) => ({
        ...prev,
        credits: prev?.credits - 1,
      }));
    } catch (e) {
      console.log(e);
      toast.error("internal server error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col items-center h-[80vh] justify-center">
      {/*Header && Description*/}
      <div>
        <h2 className="font-bold text-5xl">What Should we design ?</h2>
        <p className="mt-2 text-xl text-gray-500">
          Generate, Edit and Explore Designs with AI
        </p>
      </div>
      {/* input box */}
      <div className="w-full max-w-xl p-5 border mt-5 rounded-2xl">
        <textarea
          className="w-full h-24 focus:outline-none focus:ring-0 resize-none"
          placeholder="Describe your page design"
          value={userInput}
          onChange={(event) => setUserInput(event.target.value)}
        />
        <div className="flex justify-between">
          <Button variant="ghost">
            <ImagePlus />
          </Button>
          {!user ? (
            <SignInButton mode="modal" forceRedirectUrl={"/workspace"}>
              <Button disabled={!userInput}>
                <ArrowUp />
              </Button>
            </SignInButton>
          ) : (
            <Button disabled={!userInput || loading} onClick={CreateNewProject}>
              {loading ? <Loader2Icon className="animate-spin" /> : <ArrowUp />}
            </Button>
          )}
        </div>
      </div>

      {/*Suggestions*/}
      <div className=" mt-4 flex flex-row gap-4">
        {suggestions.map((menu, index) => (
          <Button
            key={index}
            variant={"outline"}
            onClick={() => setUserInput(menu.prompt)}
          >
            <menu.icon />

            {menu.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default Hero;
