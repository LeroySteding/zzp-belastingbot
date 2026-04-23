import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function DashboardNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="text-center space-y-4 max-w-md">
        <FileQuestion className="h-10 w-10 text-muted-foreground mx-auto" />
        <h2 className="text-lg font-semibold">Pagina niet gevonden</h2>
        <p className="text-muted-foreground text-sm">
          De pagina die je zoekt bestaat niet of is verplaatst.
        </p>
        <Button asChild>
          <Link href="/dashboard">Naar dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
