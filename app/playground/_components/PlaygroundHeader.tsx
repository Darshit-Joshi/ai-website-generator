import React, { useContext } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Download, Save, Share2, Rocket } from "lucide-react";
import { OnSaveContext } from "@/context/OnSaveContext";

function PlaygroundHeader() {
  const { onSaveData, setOnSaveData } = useContext(OnSaveContext);
  return (
    <div className="h-[73px] px-6 border-b bg-white flex items-center justify-between">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <Image src={"/logo.svg"} alt="logo" width={35} height={35} />

        <div>
          <h2 className="font-semibold text-lg">AI Website Builder</h2>

          <p className="text-xs text-gray-500">
            Generate and edit websites with AI
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>

        <Button variant="outline">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>

        <Button variant="outline" onClick={() => setOnSaveData(Date.now())}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>

        <Button>
          <Rocket className="w-4 h-4 mr-2" />
          Deploy
        </Button>
      </div>
    </div>
  );
}

export default PlaygroundHeader;
