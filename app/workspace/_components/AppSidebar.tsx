"use client";

import React, { useContext, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { useAuth, UserButton } from "@clerk/nextjs";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { UserDetailContext } from "@/context/UserDetailContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Define strict internal structural typings
interface ChatMessage {
  content: string;
}

interface Chat {
  chatMessage: ChatMessage[];
}

interface Project {
  projectId: string;
  frameId: string;
  chats: Chat[];
}

export function AppSidebar() {
  const [projectList, setProjectList] = useState<Project[]>([]);
  const { userDetail } = useContext(UserDetailContext);
  const { has } = useAuth();

  // Wrap API fetcher in useCallback to maintain reference identity across cycles
  const GetProjectList = useCallback(async () => {
    try {
      const result = await axios.get("/api/get-all-projects");
      if (result.data && Array.isArray(result.data)) {
        setProjectList(result.data);
      }
    } catch (error) {
      console.error("Failed to sync project list context:", error);
    }
  }, []);

  // Safe side-effect mount trigger with correct dependency boundaries
  useEffect(() => {
    GetProjectList();
  }, [GetProjectList]);

  // Handle premium entitlement checks reliably
  const hasUnlimitedAccess = !!(has && has({ plan: "unlimited" }));

  // Safe baseline fallback computation avoiding layout NaN issues
  const currentCredits = userDetail?.credits ?? 0;
  const progressPercentage = Math.min(
    100,
    Math.max(0, (currentCredits / 2) * 100),
  );

  return (
    <Sidebar>
      <SidebarHeader className="p-5 border-b flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="logo" width={35} height={35} priority />
          <h2 className="font-bold text-xl tracking-tight">
            AI Website Generator
          </h2>
        </div>
        <Link href="/workspace" className="w-full" passHref>
          <Button className="w-full font-medium">+ Add New Project</Button>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 mb-2 font-semibold">
            Projects
          </SidebarGroupLabel>
          {projectList.length === 0 ? (
            <p className="text-sm px-2 text-muted-foreground italic">
              No Project Found
            </p>
          ) : (
            <div className="flex flex-col gap-1 px-1">
              {projectList.map((project, index) => {
                // Defensive text fallback resolution protecting React 19 layout nodes
                const fallbackTitle = `Project Workspace #${index + 1}`;
                const computedTitle =
                  project.chats?.[0]?.chatMessage?.[0]?.content ||
                  fallbackTitle;

                return (
                  <Link
                    href={`/playground/${project.projectId}?frameId=${project.frameId}`}
                    key={project.projectId || index}
                    className="block text-sm font-medium transition-colors hover:bg-secondary p-2.5 rounded-lg cursor-pointer"
                  >
                    <span className="line-clamp-1 block w-full text-foreground">
                      {computedTitle}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t gap-4">
        {!hasUnlimitedAccess && (
          <div className="p-4 border rounded-xl space-y-3 bg-secondary/50 backdrop-blur-sm">
            <h3 className="flex justify-between items-center text-sm font-medium">
              Remaining Credits
              <span className="font-bold text-primary">{currentCredits}</span>
            </h3>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex flex-col gap-2 pt-1">
              <Link
                href="/workspace/pricing"
                className="text-xs font-semibold text-primary hover:underline text-center"
              >
                Buy More Credits
              </Link>
              <Link href="/workspace/pricing" className="w-full block" passHref>
                <Button className="w-full text-xs font-bold" variant="default">
                  Upgrade to Unlimited
                </Button>
              </Link>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2">
            <UserButton />
            <span className="text-sm font-medium text-muted-foreground">
              My Profile
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            Settings
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
