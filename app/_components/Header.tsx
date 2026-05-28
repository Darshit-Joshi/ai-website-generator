"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton, useUser } from "@clerk/nextjs";

const MenuOptions = [
  {
    name: "Pricing",
    path: "/pricing",
  },
  {
    name: "Contact Us",
    path: "/contact-us",
  },
];

function Header() {
  const { user } = useUser();

  return (
    <div className="flex items-center justify-between p-4 shadow">
      <div className="flex gap-2 items-center">
        <Image src="/logo.svg" alt="logo" width={35} height={35} />
        <h2 className="font-bold text-xl">AI Website Generator</h2>
      </div>

      <div className="flex gap-5">
        {MenuOptions.map((menu, index) => (
          <Link key={index} href={menu.path}>
            <Button variant="ghost">{menu.name}</Button>
          </Link>
        ))}
      </div>

      <div>
        {!user ? (
          <SignInButton mode="modal" forceRedirectUrl="/workspace">
            <Button>
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </SignInButton>
        ) : (
          <Link href={"/workspace"}>
            <Button>
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default Header;
