'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ContestProctoringDetailPage() {
  const router = useRouter();
  const { contestId } = useParams<{ contestId: string }>();

  useEffect(() => {
    if (contestId) {
      router.replace(`/contests/${contestId}`);
    } else {
      router.replace('/contests');
    }
  }, [contestId, router]);

  return null;
}
