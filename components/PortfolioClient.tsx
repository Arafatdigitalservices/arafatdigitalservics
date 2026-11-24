'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import type { ProjectItem } from '@/lib/types';
import { MediaImage } from './MediaImage';

interface PortfolioClientProps {
  projects: ProjectItem[];
}

export function PortfolioClient({ projects }: PortfolioClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const unique = Array.from(new Set(projects.map((p) => p.category).filter(Boolean)));
    return ['All', ...unique];
  }, [projects]);

  const filtered = useMemo(() => {
    if (selectedCategory === 'All') return projects;
    return projects.filter((p) => p.category === selectedCategory);
  }, [projects, selectedCategory]);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 border border-slate-200 rounded-xl w-fit max-w-full">
        {categories.map((category) => {
          const active = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                active
                  ? 'bg-white text-[#0F172A] shadow-xs'
                  : 'text-slate-600 hover:text-[#0F172A]'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <p className="text-base font-semibold text-[#0F172A]">
            No projects found in this category yet.
          </p>
          <p className="text-sm text-slate-600">
            Select another category or publish a new project in the Admin Dashboard.
          </p>
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className="min-h-[44px] inline-flex items-center px-4 py-2 text-sm font-medium text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
          >
            View All Projects
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filtered.map((project) => (
            <article
              key={project.id}
              className="group bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
            >
              <Link href={`/portfolio/${project.slug}`} className="block aspect-[4/3] overflow-hidden bg-slate-100">
                <MediaImage
                  src={project.image_url}
                  alt={project.title}
                  title={project.title}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </Link>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-medium text-[#2563EB]">{project.category}</span>
                    {project.client_name ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{project.client_name}</span>
                      </>
                    ) : null}
                  </div>

                  <h2 className="font-display text-xl font-semibold text-[#0F172A] leading-snug">
                    <Link
                      href={`/portfolio/${project.slug}`}
                      className="hover:text-[#2563EB] transition-colors"
                    >
                      {project.title}
                    </Link>
                  </h2>

                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {project.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <Link
                    href={`/portfolio/${project.slug}`}
                    className="inline-flex items-center gap-1.5 py-1 text-sm font-medium text-[#0F172A] hover:text-[#2563EB] transition-colors whitespace-nowrap"
                  >
                    View Details
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>

                  {project.live_url ? (
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 py-1 text-xs font-medium text-[#2563EB] hover:text-blue-700 whitespace-nowrap"
                    >
                      Live Preview
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">Preview editable in Admin</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
