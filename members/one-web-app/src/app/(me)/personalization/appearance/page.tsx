import { Separator } from "@/components/ui/separator"
import { AppearanceForm } from "./appearance-form"

export default function SettingsAppearancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize the appearance of your apps across the internet.
        </p>
      </div>
      <Separator />
      <AppearanceForm />
    </div>
  )
}
