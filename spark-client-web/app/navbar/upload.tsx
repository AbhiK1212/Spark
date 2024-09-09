//client side component to upload the video
'use client';

import{Fragment} from 'react';
import {uploadVideo} from '@/utilities/firebase/functions';

export default function Upload() {

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.item(0);
        if (file) {
           handleUpload(file);
        }
    }

    const handleUpload = async (file: File) => {
        try {
           await uploadVideo(file);
           alert(`Video uploaded successfully. Response: ${JSON.stringify(Response)}`);
        } catch (error) {
            alert('Failed to upload video');
        }
    }

    return(
        
        <Fragment>
            <input id="upload" className="hidden" type="file" accept='video/*'
                onChange={handleFileChange}
            />
            <label htmlFor="upload" className="flex justify-center items-center w-16 h-16 rounded-full text-black border-none cursor-pointer font p-2 hover:bg-gray-200">

                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>

            </label>
        </Fragment>


    )

}

