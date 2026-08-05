import { useEffect, useState, type CSSProperties } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { FeaturePage } from "@/src/pages/feature-page";
import { getFeaturePage } from "@/src/pages/page-definitions";
import { OceanBackground, OceanHome } from "@/src/pages/ocean-home";

import "./App.css";

const DEFAULT_PAGE_SLUG = "smart-monitoring";

function getCurrentPageSlug() {
  return window.location.hash.slice(1) || DEFAULT_PAGE_SLUG;
}

function App() {
  const [pageSlug, setPageSlug] = useState(getCurrentPageSlug);
  const currentPage = getFeaturePage(pageSlug);
  const isOceanPage = !currentPage || currentPage.slug === DEFAULT_PAGE_SLUG;

  useEffect(() => {
    const handleHashChange = () => setPageSlug(getCurrentPageSlug());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <div className="relative min-h-svh">
      {isOceanPage && <OceanBackground />}
      <SidebarProvider
        className={isOceanPage ? "pointer-events-none relative z-10 bg-transparent!" : undefined}
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as CSSProperties
        }
      >
        <AppSidebar
          variant="inset"
          className={isOceanPage ? "pointer-events-auto" : undefined}
        />
        <SidebarInset
          className={
            isOceanPage
              ? "pointer-events-none h-svh min-h-0 overflow-hidden bg-transparent! md:h-[calc(100svh-1rem)]"
              : "min-h-0 overflow-hidden"
          }
        >
          <div
            className={
              isOceanPage
                ? "pointer-events-auto bg-background/70 backdrop-blur-xl"
                : undefined
            }
          >
            <SiteHeader title={currentPage?.title} />
          </div>
          {isOceanPage ? <OceanHome /> : <FeaturePage page={currentPage} />}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export default App;
