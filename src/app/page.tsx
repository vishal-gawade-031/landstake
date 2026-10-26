import LandMapWrapper from '@/components/map/LandMapWrapper';
import { Suspense } from 'react';

export default async function HomePage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const ulpinParam = typeof searchParams?.ulpin === 'string' ? searchParams.ulpin : undefined;

  return (
    <div className="flex-1 flex flex-col relative w-full overflow-hidden">
      <Suspense fallback={<div className="w-full h-[calc(100vh-6rem)] bg-slate-900 flex items-center justify-center text-white font-bold">Loading GIS Cadastre...</div>}>
        <LandMapWrapper initialUlpin={ulpinParam} />
      </Suspense>
    </div>
  );
}
