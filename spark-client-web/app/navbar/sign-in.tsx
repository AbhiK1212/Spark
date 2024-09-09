'use client';   

import { Fragment } from "react";

import { signInWithGoogle, signOut } from "@/utilities/firebase/firebase";
import { User } from "firebase/auth";

interface SignInProps{
    user: User | null;
}

export default function SignIn({ user }: SignInProps) {
    return (
        <Fragment>
            { user ? 
                (
                    <button onClick={signOut} className="inline-block border border-gray-500 text-[#065fd4] py-2.5 px-5 rounded-[24px] font-sans text-base font-medium cursor-pointer hover:bg-[#bee0fd] hover:border-transparent">
                        Sign Out
                    </button>
                ) : (
                    <button onClick={signInWithGoogle} className="inline-block border border-gray-500 text-[#065fd4] py-2.5 px-5 rounded-[24px] font-sans text-base font-medium cursor-pointer hover:bg-[#bee0fd] hover:border-transparent">
                        Sign In
                    </button>
                )
            }
        </Fragment>
    );
}