import { useEffect, useState, type CSSProperties } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { FeaturePage } from "@/src/pages/feature-page";
import { getFeaturePage } from "@/src/pages/page-definitions";
import { OceanBackground, OceanHome } from "@/src/pages/ocean-home";
import { OceanInteractionProvider } from "@/src/pages/ocean-interaction-context";

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
    <OceanInteractionProvider>
      <div className="relative min-h-svh">
        {isOceanPage && <OceanBackground />}
        <SidebarProvider
          defaultOpen={false}
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
                ? "pointer-events-none h-svh min-h-0 overflow-hidden bg-transparent! md:m-0! md:rounded-none! md:shadow-none!"
                : "min-h-0 overflow-hidden"
            }
          >
            {isOceanPage ? (
              <div className="pointer-events-auto absolute top-3 left-3 z-20">
                <SidebarTrigger className="bg-background/70 shadow-sm backdrop-blur-xl hover:bg-background/85" />
              </div>
            ) : (
              <SiteHeader title={currentPage?.title} />
            )}
            {isOceanPage ? <OceanHome /> : <FeaturePage page={currentPage} />}
          </SidebarInset>
        </SidebarProvider>
        <Toaster richColors />
      </div>
    </OceanInteractionProvider>
  );
}

export default App;
