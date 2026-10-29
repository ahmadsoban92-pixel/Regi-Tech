"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/types/content";

type GalleryImage = NonNullable<Product["gallery"]>[number];

export function ProductGallery({ eager, gallery, image, name }: { eager: boolean; gallery?: GalleryImage[]; image: string; name: string }) {
  const photos = gallery?.length ? gallery : [{ src: image, alt: `${name} motorcycle number plate` }];
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const active = photos[selected] ?? photos[0];

  return (
    <div className="group relative aspect-[1.3/1] overflow-hidden border-b border-[var(--line)] bg-[var(--surface-soft)]" onPointerEnter={(event) => { if (event.pointerType === "mouse") setExpanded(true); }} onPointerLeave={(event) => { if (event.pointerType === "mouse") setExpanded(false); }}>
      <Image alt={active.alt} className="object-cover" fill loading={eager ? "eager" : "lazy"} sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 386px" src={active.src} />
      {photos.length > 1 ? (
        <>
          <button aria-controls={`gallery-${name.replace(/\W+/g, "-")}`} aria-expanded={expanded} aria-label={`Show ${name} photographs`} className="absolute right-3 top-3 rounded-md bg-[var(--background)]/90 px-2.5 py-1.5 text-xs font-semibold text-[var(--foreground)] shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] md:hidden" onClick={() => setExpanded((value) => !value)} type="button">Photos · {photos.length}</button>
          <div className={`absolute inset-x-0 bottom-0 bg-[var(--background)]/95 p-2 transition-opacity duration-150 motion-reduce:transition-none ${expanded ? "opacity-100" : "pointer-events-none opacity-0"} group-focus-within:pointer-events-auto group-focus-within:opacity-100`} id={`gallery-${name.replace(/\W+/g, "-")}`}>
            <div aria-label={`${name} photos`} className="flex gap-2 overflow-x-auto pb-1" role="group">
              {photos.map((photo, index) => (
                <button aria-label={`View photo ${index + 1} of ${photos.length}: ${photo.alt}`} aria-pressed={selected === index} className={`relative h-14 w-[4.8rem] shrink-0 overflow-hidden rounded border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${selected === index ? "border-[var(--accent)]" : "border-white/40"}`} key={photo.src} onClick={() => setSelected(index)} type="button">
                  <Image alt="" className="object-cover" fill sizes="80px" src={photo.src} />
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
