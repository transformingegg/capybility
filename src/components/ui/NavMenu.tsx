import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { Button } from "./button"
import { ChevronDown } from "lucide-react"

export function NavMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="text-[#00c7df] hover:bg-transparent hover:opacity-80 font-bold h-auto py-2 text-lg whitespace-nowrap">
          Other <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <Link href="/why-capybility" className="text-[#00c7df] font-bold text-lg whitespace-nowrap">Guide</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/season-3-yuzu" className="text-[#00c7df] font-bold text-lg whitespace-nowrap">Season 3 Yuzu</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dapp-directory" className="text-[#00c7df] font-bold text-lg whitespace-nowrap">DApp Directory</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
