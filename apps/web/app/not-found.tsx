import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-semibold">Pagina niet gevonden</h2>
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
