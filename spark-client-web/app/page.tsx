import Image from "next/image";
import { getVideos } from "../utilities/firebase/functions";
import Link from "next/link";

export default async function Home() {
  const videos =  await getVideos();

//Map over the videos and display them as thumbnails on the page
  return (
    <main className="flex">
      {videos.map((video) => (
        <Link href={`/watch?v=${video.filename}`} key={`${video.filename}`}>
          <Image src={'/thumbnail.png'} alt='video' width={120} height={80} className="m-2.5"/>
        </Link>
      ))}
    </main>
  );
}

// Every 30 seconds, the page will be revalidated- reducing the load on the server
export const revalidate = 30;