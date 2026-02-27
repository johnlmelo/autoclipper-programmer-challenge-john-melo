import Link from "next/link";
import { SquareArrowRightExit, Video } from "lucide-react";

type EditorTopBarProps = {
  projectName: string;
  onProjectNameChange: (value: string) => void;
  onRenderClick: () => void;
};

export function EditorTopBar({
  projectName,
  onProjectNameChange,
  onRenderClick,
}: EditorTopBarProps) {
  return (
    <header className="border-b border-[#1a2a46] bg-[#08142b] px-4 py-3">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <Link href="/" className="inline-flex text-lg font-semibold text-white shrink-0">
          <Video className="mr-2"/>
          Sabooor Premiere
        </Link>

        <button
          type="button"
          onClick={onRenderClick}
          className="cursor-pointer inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500"
        >
          <SquareArrowRightExit className="size-4" />
          Renderizar
        </button>
        
      </div>
    </header>
  );
}
