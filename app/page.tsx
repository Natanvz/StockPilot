import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';

export default function Home() {
  const t = useTranslations('home');
  const tApp = useTranslations('app');

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">{tApp('name')}</h1>
        <p className="text-muted-foreground max-w-md text-balance">{t('tagline')}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button asChild>
          <Link href="/sign-in">{t('signIn')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/sign-up">{t('createAccount')}</Link>
        </Button>
      </div>
    </main>
  );
}
