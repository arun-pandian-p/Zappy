import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { blogPosts } from './blogData';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "author": {
      "@type": "Organization",
      "name": "Zappy"
    },
    "datePublished": "2026-06-13",
    "url": `https://zappy.ind.in/blog/${post.slug}`
  };

  return (
    <>
      <SEO 
        title={`${post.title} | Zappy Blog`}
        description={post.excerpt}
        canonical={`https://zappy.ind.in/blog/${post.slug}`}
        keywords={post.tags.join(', ')}
        schema={schema}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-24 px-4 sm:px-6 lg:px-8">
        <article className="max-w-3xl mx-auto prose dark:prose-invert lg:prose-lg">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
               <span className="text-sm font-semibold text-primary uppercase tracking-wider">{post.category}</span>
               <span className="text-sm text-slate-500">• {post.readTime}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">{post.title}</h1>
          </div>
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>
      </div>
    </>
  );
}
