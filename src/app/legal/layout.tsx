
'use client';

// This layout ensures that pages within the /legal directory are publicly accessible
// and not wrapped by any authentication-requiring layouts.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-foreground min-h-screen">
        {children}
    </div>
  );
}
