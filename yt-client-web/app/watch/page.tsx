'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dotenv from 'dotenv';

dotenv.config();

function WatchContent() {
  const videoPrefix = process.env.videoPrefix || '';
  const videoSrc = useSearchParams().get('v');

  return (
    <div>
      <h1 className='text-3xl m-2.5'>Watch page</h1>
      <video controls className="p-10 w-full h-auto" src={videoPrefix + videoSrc} />
    </div>
  );
}

export default function Watch() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WatchContent />
    </Suspense>
  );
}