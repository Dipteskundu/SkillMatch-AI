import { Suspense } from 'react';
import TestContent from './TestContent';

export default function CommunicationTestPage() {
  return (
    <Suspense fallback={<div className='min-h-screen theme-page flex items-center justify-center'><div className='w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin'/></div>}>
      <TestContent />
    </Suspense>
  );
}