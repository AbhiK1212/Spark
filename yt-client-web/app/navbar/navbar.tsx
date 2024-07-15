'use client';

import Image from "next/image";
import Link from "next/link"
import { onAuthStateChange } from "@/utilities/firebase/firebase";

import SignIn from "./sign-in";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";

export default function Navbar() {
   //closure
   //Init user state
    const [user, setUser] = useState<User | null>(null);

    //run some javascript when the component mounts
    useEffect(() => { 
        const unsubscribe =  onAuthStateChange((user) => {
            setUser(user);
    });
    //Cleanup subscription when component unmounts
    return () => unsubscribe();
});

    return (
        <nav className="flex justify-between items-center p-4">
            <Link href="/"> 
                <Image width={90} height={20} src="/youtube-logo.svg" alt="Youtube Logo" />
            </Link >
            {
                //TODO: add a upload
            }
            <SignIn user={user}/>
        </nav>

    );
}