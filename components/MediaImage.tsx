'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface MediaImageProps {
  src?: string;
  alt: string;
  title?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

function isNextImageSupportedSrc(src: string): boolean {
  if (src.startsWith('/images/') || src.startsWith('/uploads/')) {
    return true;
  }
  try {
    const parsed = new URL(src);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

export function MediaImage({
  src,
  alt,
  title,
  className = '',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
}: MediaImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50/70 to-slate-200/80 text-slate-600 p-6 text-center w-full h-full ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="w-10 h-10 rounded-lg bg-white/80 border border-slate-200 flex items-center justify-center mb-2 text-[#2563EB]">
          <ImageIcon className="w-5 h-5" aria-hidden="true" />
        </div>
        {title ? (
          <span className="text-xs font-medium text-slate-600 line-clamp-2 max-w-[220px]">
            {title}
          </span>
        ) : null}
      </div>
    );
  }

  if (isNextImageSupportedSrc(src)) {
    return (
      <div className="relative w-full h-full">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={className}
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
