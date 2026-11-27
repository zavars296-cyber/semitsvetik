import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <p className="font-display text-7xl font-semibold text-red">404</p>
        <h1 className="mt-4 font-display text-2xl">Сторінку не знайдено</h1>
        <Link href="/" className="btn-primary mt-6">На головну</Link>
      </div>
    </main>
  );
}
