import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { blogPosts } from './blogData';

export default function BlogIndex() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Zappy Restaurant Technology Blog",
    "url": "https://zappy.ind.in/blog",
    "description": "Insights, guides, and trends in restaurant menu management and AI technology."
  };

  return (
    <>
      <SEO 
        title="Zappy Blog | Restaurant Tech & Menu Management Insights"
        description="Read the latest insights, guides, and trends in restaurant menu management, AI OCR technology, and digital dining experiences."
        canonical="https://zappy.ind.in/blog"
        schema={schema}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-12">Restaurant Technology Blog</h1>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map(post => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="block group">
              <article className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {post.category}
                    </span>
                    <span className="text-xs text-slate-500">{post.readTime}</span>
                  </div>
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
