import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, CameraIcon, FileTextIcon, Settings2Icon, SearchIcon, DatabaseIcon, FileChartColumnIcon } from "lucide-react"
import haifengLogo from "@/src/assets/haifeng-logo.png"

const data = {
  user: {
    name: "张三",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "智能监盘",
      url: "#smart-monitoring",
      icon: (
        <LayoutDashboardIcon
        />
      ),
    },
    {
      title: "智能运维",
      url: "#smart-operations",
      icon: (
        <ListIcon
        />
      ),
    },
    {
      title: "数据分析",
      url: "#data-analysis",
      icon: (
        <ChartBarIcon
        />
      ),
    },
    {
      title: "知识库",
      url: "#knowledge-base",
      icon: (
        <FolderIcon
        />
      ),
    },
    {
      title: "Agent团队",
      url: "#agent-team",
      icon: (
        <UsersIcon
        />
      ),
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: (
        <CameraIcon
        />
      ),
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: (
        <FileTextIcon
        />
      ),
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: (
        <FileTextIcon
        />
      ),
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#settings",
      icon: (
        <Settings2Icon
        />
      ),
    },
    {
      title: "Search",
      url: "#search",
      icon: (
        <SearchIcon
        />
      ),
    },
  ],
  documents: [
    {
      name: "数据库",
      url: "#database",
      icon: (
        <DatabaseIcon
        />
      ),
    },
    {
      name: "运维报告",
      url: "#operations-reports",
      icon: (
        <FileChartColumnIcon
        />
      ),
    },
  ],
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <img
                src={haifengLogo}
                alt="海风运维AI工作台 Logo"
                className="size-5! rounded-sm object-contain"
              />
              <span className="text-base font-semibold">海风运维AI工作台</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
