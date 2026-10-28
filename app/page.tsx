import { useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  const t = useTranslations('home');
  const tApp = useTranslations('app');

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h1 className="text-4xl font-semibold tracking-tight">{tApp('name')}</h1>
      <p className="text-muted-foreground max-w-md text-balance">{t('tagline')}</p>
      <p className="text-muted-foreground/70 text-sm">{t('scaffoldNote')}</p>
    </main>
  );
}
