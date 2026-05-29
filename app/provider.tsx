"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { UserDetailContext } from "@/context/UserDetailContext";
import { OnSaveContext } from "@/context/OnSaveContext";

export default function Provider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [userDetail, setUserDetail] = useState<any>(null);
  const [onSaveData, setOnSaveData] = useState<any>(null);

  // Memoize data synchronization worker to preserve component identities
  const syncUserWorkspaceContext = useCallback(async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    try {
      const response = await axios.post("/api/users");
      if (response.data?.user) {
        setUserDetail(response.data.user);
      }
    } catch (error) {
      console.error("Workspace configuration context sync halted:", error);
    }
  }, [user]);

  useEffect(() => {
    if (isLoaded && user) {
      syncUserWorkspaceContext();
    }
  }, [user, isLoaded, syncUserWorkspaceContext]);

  return (
    <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
      <OnSaveContext.Provider value={{ onSaveData, setOnSaveData }}>
        {children}
      </OnSaveContext.Provider>
    </UserDetailContext.Provider>
  );
}
