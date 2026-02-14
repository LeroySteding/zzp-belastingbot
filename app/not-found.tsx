import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-md text-center">
        <FileQuestion className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-4">Pagina niet gevonden</h1>
        <p className="text-muted-foreground mb-8">
          De pagina die je zoekt bestaat niet of is verplaatst.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard">
            <Button>Ga naar Dashboard</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Ga naar home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
