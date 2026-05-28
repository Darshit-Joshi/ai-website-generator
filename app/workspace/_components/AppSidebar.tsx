"use client";
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
import Image from "next/image";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";
import axios from "axios";

export function AppSidebar() {
  const [projectList, setProjectList] = useState([]);
  const { userDetail, setUserDetail } = useContext(UserDetailContext);
  const { has } = useAuth();
  useEffect(() => {
    GetProjectList();
  }, []);

  const hasUnlimitedAccess = has && has({ plan: "unlimited" });
  const GetProjectList = async () => {
    const result = await axios.get("/api/get-all-projects");
    setProjectList(result.data);
  };
  return (
    <Sidebar>
      <SidebarHeader className="p-5 border-b">
        <div className="flex items-center gap-2">
          <Image src={"/logo.svg"} alt="logo" width={35} height={35} />
          <h2 className="font-bold text-xl">AI Website Generator</h2>
        </div>
        <Link href={"/workspace"} className="mt-5 w-full">
          <Button className={"w-full"}>+ Add New Project</Button>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          {projectList.length === 0 && (
            <h2 className="text-sm px-2 text-gray-500">No Project Found</h2>
          )}

          <div>
            {projectList.map((project: any, index) => {
              <Link
                href={`/playground/${project.projectId}?frameId${project.frameId}`}
                key={index}
                className="my-2 hover:bg-secondary p-2 rounded-lg pointer"
              >
                <h2 className="line-clamp-1 p-1">
                  {project.chats[0].chatMessage[0]?.content}
                </h2>
              </Link>;
            })}
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {!hasUnlimitedAccess && (
          <div className="p-3 border rounded-xl space-y-3 bg-secondary">
            <h2 className="flex justify-between items-center">
              Remaining Credits
              <span>{userDetail?.credits}</span>
            </h2>
            <Progress value={(userDetail?.credits / 2) * 100} />
            <Link href={`/workspace/pricing`} className="w-full">
              Buy More credits
            </Link>
            <Button className="w-full"> Upgrade to Unlimited</Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <UserButton />
          <Button variant={"ghost"}>Settings</Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
