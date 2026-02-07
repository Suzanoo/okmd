// app/media/page.tsx
import Link from "next/link";

const YT_PLAYLIST_URL =
  "https://www.youtube.com/watch?v=ojVv4jsDcsQ&list=PL0Rzid1eaNsJOTXtw5mUpFMSUtoprkN5O";

// ดึง playlist id จาก URL (list=...)
const YT_PLAYLIST_ID = new URL(YT_PLAYLIST_URL).searchParams.get("list") ?? "";

export default function MediaPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Media</h1>
          <p className="mt-2 text-muted-foreground">
            ลิงก์วิดีโอ timelapse / progress ของโครงการ (YouTube)
          </p>
        </div>

        <Link
          href={YT_PLAYLIST_URL}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
        >
          Open playlist ↗
        </Link>
      </div>

      <section className="mt-6 grid gap-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-sm font-medium">OKMD Timelapse Playlist</div>
          <div className="mt-1 text-xs text-muted-foreground">
            YouTube Playlist
          </div>

          <div className="mt-4 aspect-video w-full overflow-hidden rounded-lg border">
            {YT_PLAYLIST_ID ? (
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/videoseries?list=${YT_PLAYLIST_ID}`}
                title="OKMD Timelapse Playlist"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                Missing playlist id (list=...)
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={YT_PLAYLIST_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
            >
              Watch on YouTube ↗
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
