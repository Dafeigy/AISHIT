import { ActivityIcon } from "lucide-react"
import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { FeaturePageDefinition } from "@/src/pages/page-definitions"

export function FeaturePage({
  page,
  children,
}: {
  page: FeaturePageDefinition
  children?: ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ActivityIcon className="size-5" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>{page.title}</CardTitle>
              <CardDescription>{page.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {page.details}
          </p>
        </CardContent>
      </Card>
      {children}
    </div>
  )
}
