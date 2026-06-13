import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  keywords?: string;
  ogImage?: string;
  schema?: Record<string, any> | Record<string, any>[];
  noindex?: boolean;
}

export const SEO: React.FC<SEOProps> = ({
  title = "Zappy | The Restaurant Operating System",
  description = "One platform for menus, orders, billing, kitchen workflows, analytics, and customer experiences. The complete Restaurant Operating System.",
  canonical = "https://www.zappy.ind.in",
  keywords = "restaurant operating system, restaurant software, QR ordering, kitchen display system, restaurant billing, restaurant analytics, digital menu platform",
  ogImage = "https://www.zappy.ind.in/og-image.png",
  schema,
  noindex = false
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonical} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />

      {/* Security & Indexing */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* JSON-LD Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};
