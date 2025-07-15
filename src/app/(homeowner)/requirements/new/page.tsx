import { RequirementForm } from "@/components/requirement-form";

export default function NewRequirementPage() {
  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-2xl font-bold font-headline tracking-tight">Create a New Requirement</h1>
          <p className="text-muted-foreground">Describe your project to get quotes from qualified professionals.</p>
        </div>
      <RequirementForm />
    </div>
  );
}
