"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { log } from "console";
import { useUser } from "@clerk/nextjs";
import { UserDetailContext } from "@/context/UserDetailContext";
import { OnSaveContext } from "@/context/OnSaveContext";
function Provider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = useUser();
  const [userDetail, setUserDetail] = useState<any>();
  const [onSavedata, setOnSaveData] = useState<any>();

  useEffect(() => {
    CreateNewUser();
  }, [user]);

  const CreateNewUser = async () => {
    const result = await axios.post("/api/users", {});
    console.log(result.data);
    setUserDetail(result.data?.user);
  };
  return (
    <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
      <OnSaveContext.Provider value={{ onSavedata, setOnSaveData }}>
        <div>{children}</div>
      </OnSaveContext.Provider>
    </UserDetailContext.Provider>
  );
}
export default Provider;
