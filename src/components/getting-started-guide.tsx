

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { List, Edit, FileText } from "lucide-react";

const steps = [
  {
    icon: <List className="h-8 w-8 text-primary" />,
    title: "Step 1: Post Your Requirement",
    description: "Click the 'Post a New Requirement' button and choose a category that fits your needs.",
  },
  {
    icon: <Edit className="h-8 w-8 text-primary" />,
    title: "Step 2: Fill in the Details",
    description: "Provide a title, description, and any specific details like brands or quantities. You can also upload photos.",
  },
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: "Step 3: Receive Quotes",
    description: "Local shop owners will see your post and send you competitive quotations directly through the platform.",
  },
];

export function GettingStartedGuide() {
  return (
    <Card className="bg-secondary/50 border-2 border-dashed">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline">Welcome! Let's Get You Started</CardTitle>
        <CardDescription>Posting your first requirement is easy. Just follow these steps.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center p-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
                {step.icon}
              </div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
