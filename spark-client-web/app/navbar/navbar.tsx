'use client';

import Image from 'next/image';
import Link from 'next/link';
import { onAuthStateChange } from '@/utilities/firebase/firebase';

import SignIn from './sign-in';
import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import Upload from './upload';

export default function Navbar() {
  //closure
  //Init user state
  const [user, setUser] = useState<User | null>(null);

  //run some javascript when the component mounts
  useEffect(() => {
    const unsubscribe = onAuthStateChange(user => {
      setUser(user);
    });
    //Cleanup subscription when component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <nav className="flex justify-between items-center p-4 bg-white border-b border-gray-200 shadow-sm">
      <Link
        href="/"
        className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
      >
        <Image
          width={120}
          height={40}
          src="/spark-logo.svg"
          alt="Spark Logo"
          priority
        />
      </Link>
      <div className="flex items-center space-x-4">
        {user && <Upload />}
        <SignIn user={user} />
      </div>
    </nav>
  );
}
